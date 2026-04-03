#!/usr/bin/env bash
###############################################################################
# PixelTown Autonomous Supervisor
# 驱动 Claude Code 自主完成 6 个阶段，直到交付商业级像素风网站
#
# 用法:
#   chmod +x scripts/pixeltown-supervisor.sh
#   ./scripts/pixeltown-supervisor.sh
#
# 恢复:
#   直接重新运行即可，脚本从 state.json 读取进度继续
###############################################################################
set -uo pipefail

# 确保 PATH 包含所有必要工具
export PATH="$HOME/.local/bin:$HOME/Library/pnpm:$HOME/miniconda3/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

PROJECT_DIR="/Users/yuxijian/claudeProjects/PixelTown"
AUTOPILOT_DIR="$PROJECT_DIR/.autopilot"
STATE_FILE="$AUTOPILOT_DIR/state.json"
PROGRESS_FILE="$AUTOPILOT_DIR/PROGRESS.md"
TASK_NOTES="$AUTOPILOT_DIR/TASK_NOTES.md"
LOG_DIR="$AUTOPILOT_DIR/logs"
PROMPTS_DIR="$AUTOPILOT_DIR/phase_prompts"

# --- 配置 ---
GLOBAL_MAX_ITERATIONS=150
PHASE_MAX_ITERATIONS=(5 10 10 10 8 8)   # 每阶段最大迭代
STALE_THRESHOLD=3                        # 连续无变更次数阈值
MAX_CONSECUTIVE_FAILURES=3               # 连续失败次数阈值
TOTAL_PHASES=6

# Claude 参数
CLAUDE_MODEL="sonnet"                    # 用 sonnet 执行，性价比最优
CLAUDE_TIMEOUT=600                       # 每次调用最大秒数

# --- 启动检查 ---
for cmd in claude pnpm git python3; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' not found in PATH. PATH=$PATH"
    exit 1
  fi
done

# --- 颜色输出 ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# --- 日志 ---
log() {
  local ts
  ts=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "${CYAN}[$ts]${NC} $1" | tee -a "$LOG_DIR/supervisor.log"
}

log_success() { log "${GREEN}✓ $1${NC}"; }
log_warn()    { log "${YELLOW}⚠ $1${NC}"; }
log_error()   { log "${RED}✗ $1${NC}"; }
log_phase()   { log "${BLUE}━━━ $1 ━━━${NC}"; }

# --- JSON state 读写 (用 python，macOS 自带) ---
read_state() {
  python3 -c "
import json, sys
with open('$STATE_FILE') as f:
    state = json.load(f)
for k, v in state.items():
    if isinstance(v, list):
        print(f'{k}={json.dumps(v)}')
    elif isinstance(v, bool):
        print(f'{k}={str(v).lower()}')
    else:
        print(f'{k}={v}')
" 2>/dev/null
}

get_state_field() {
  python3 -c "
import json
with open('$STATE_FILE') as f:
    state = json.load(f)
print(state.get('$1', '$2'))
"
}

update_state() {
  # 用法: update_state key1 val1 key2 val2 ...
  local py_updates=""
  while [[ $# -ge 2 ]]; do
    local key="$1" val="$2"
    shift 2
    # 判断值类型：纯数字(整数)用数字，其他用字符串
    if [[ "$val" == "true" || "$val" == "false" ]]; then
      py_updates+="state['$key'] = $val; "
    elif [[ "$val" =~ ^[0-9]+$ ]]; then
      # 纯数字（不含连字符、冒号等）
      py_updates+="state['$key'] = $val; "
    elif [[ "$val" == \[* ]]; then
      py_updates+="state['$key'] = json.loads('$val'); "
    else
      # 字符串值（包括日期、状态文本等）
      py_updates+="state['$key'] = '$val'; "
    fi
  done

  python3 -c "
import json
with open('$STATE_FILE') as f:
    state = json.load(f)
$py_updates
with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)
"
}

# --- Git 辅助 ---
get_last_commit() {
  git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null || echo "none"
}

check_meaningful_change() {
  local before_hash="$1"
  local after_hash
  after_hash=$(get_last_commit)

  if [[ "$before_hash" == "$after_hash" ]]; then
    return 1  # 无变更
  fi

  # 检查变更行数
  local lines_changed
  lines_changed=$(git -C "$PROJECT_DIR" diff --stat "$before_hash" "$after_hash" 2>/dev/null | tail -1 | grep -oE '[0-9]+' | head -1)
  [[ "${lines_changed:-0}" -gt 5 ]]
}

# --- 质量门 ---
run_quality_gates() {
  local phase=$1
  local all_pass=true
  local report=""

  log "运行质量门检查..."

  # Build
  if (cd "$PROJECT_DIR/apps/web" && pnpm build > "$LOG_DIR/build_latest.log" 2>&1); then
    report+="BUILD: ✓ PASS\n"
    log_success "Build passed"
  else
    report+="BUILD: ✗ FAIL\n"
    log_error "Build failed"
    all_pass=false
  fi

  # Lint
  if (cd "$PROJECT_DIR/apps/web" && pnpm lint > "$LOG_DIR/lint_latest.log" 2>&1); then
    report+="LINT: ✓ PASS\n"
    log_success "Lint passed"
  else
    report+="LINT: ✗ FAIL (warnings may be OK)\n"
    log_warn "Lint had issues"
    # lint 警告不算失败
  fi

  # Test (阶段 0 之后才有)
  if grep -q '"test"' "$PROJECT_DIR/apps/web/package.json" 2>/dev/null; then
    if (cd "$PROJECT_DIR/apps/web" && pnpm test > "$LOG_DIR/test_latest.log" 2>&1); then
      report+="TEST: ✓ PASS\n"
      log_success "Tests passed"
    else
      report+="TEST: ✗ FAIL\n"
      log_error "Tests failed"
      all_pass=false
    fi
  else
    report+="TEST: ⊘ SKIP (no test script)\n"
  fi

  echo -e "$report" > "$LOG_DIR/quality_report_latest.txt"
  $all_pass
}

# --- 阶段完成检查 (独立 Claude 实例) ---
check_phase_completion() {
  local phase=$1
  log "检查阶段 $phase 验收标准..."

  local phase_prompt
  phase_prompt=$(cat "$PROMPTS_DIR/phase_${phase}.md" 2>/dev/null || echo "")
  local quality_report
  quality_report=$(cat "$LOG_DIR/quality_report_latest.txt" 2>/dev/null || echo "")

  local result
  result=$(cd "$PROJECT_DIR" && claude -p "$(cat <<CHECKER_EOF
你是 PixelTown 项目的 QA 检查员。

当前阶段: Phase $phase
阶段提示词中的验收标准:
$phase_prompt

最新质量门报告:
$quality_report

请检查当前代码库状态是否满足上面验收标准中的所有 [ ] 项。
逐项检查每个标准，读取必要的文件验证。

最终只输出一行结论（不要有其他内容）:
- PHASE_COMPLETE — 如果所有验收标准都已满足
- PHASE_INCOMPLETE: <缺少什么> — 如果有标准未满足
- PHASE_BLOCKED: <原因> — 如果有根本性阻碍
CHECKER_EOF
)" --model "$CLAUDE_MODEL" \
     --allowedTools "Read,Grep,Glob,Bash" \
     --permission-mode bypassPermissions \
     2>"$LOG_DIR/checker_phase${phase}.err" || echo "PHASE_INCOMPLETE: checker failed")

  echo "$result" | tee "$LOG_DIR/checker_phase${phase}_result.txt"
  echo "$result" | grep -q "PHASE_COMPLETE"
}

# --- 执行一次迭代 ---
run_phase_iteration() {
  local phase=$1
  local iteration=$2
  local before_hash
  before_hash=$(get_last_commit)

  log_phase "Phase $phase | 迭代 $iteration"

  local phase_prompt
  phase_prompt=$(cat "$PROMPTS_DIR/phase_${phase}.md" 2>/dev/null || echo "ERROR: missing prompt")
  local task_notes
  task_notes=$(cat "$TASK_NOTES" 2>/dev/null || echo "无历史上下文")
  local quality_report
  quality_report=$(cat "$LOG_DIR/quality_report_latest.txt" 2>/dev/null || echo "首次迭代，无报告")

  local full_prompt
  full_prompt="$(cat <<PROMPT_EOF
# PixelTown 自主构建 — Phase $phase, 迭代 $iteration

## 你的任务
$phase_prompt

## 跨会话上下文（上次迭代留下的笔记）
$task_notes

## 上次质量门报告
$quality_report

## 执行规则
1. 做增量进展，不要试图一次完成所有内容。
2. 改动后运行 \`cd apps/web && pnpm build\` 验证。
3. 如果有测试脚本，运行 \`pnpm test\` 确认无回归。
4. 每个有意义的改动后 commit: \`git add -A && git commit -m "feat(phase-$phase): 描述"\`
5. 更新 .autopilot/TASK_NOTES.md:
   - 本次迭代完成了什么
   - 还剩什么要做
   - 阻碍或需要的决策
   - 给下次迭代的关键上下文
6. 不要修改 .autopilot/ 下除 TASK_NOTES.md 以外的文件。
PROMPT_EOF
)"

  local iter_log="$LOG_DIR/phase${phase}_iter${iteration}_$(date +%s).log"

  # 运行 Claude
  if (cd "$PROJECT_DIR" && timeout "${CLAUDE_TIMEOUT}" claude -p "$full_prompt" \
    --model "$CLAUDE_MODEL" \
    --allowedTools "Read,Write,Edit,Bash,Grep,Glob,Skill" \
    --permission-mode bypassPermissions \
    > "$iter_log" 2>&1); then
    log_success "Claude 执行完成"
  else
    local exit_code=$?
    if [[ $exit_code -eq 124 ]]; then
      log_error "Claude 超时 (${CLAUDE_TIMEOUT}s)"
    else
      log_error "Claude 退出码 $exit_code"
    fi
    return 1
  fi

  # 检查有效变更
  if check_meaningful_change "$before_hash"; then
    log_success "检测到有效代码变更"
    return 0
  else
    log_warn "本次迭代无有效变更"
    return 2  # 特殊码：停滞
  fi
}

# --- 恢复/升级尝试 ---
run_recovery() {
  local phase=$1
  log_warn "尝试恢复..."

  local last_error
  last_error=$(tail -50 "$LOG_DIR"/phase${phase}_iter*_*.log 2>/dev/null | tail -20)

  (cd "$PROJECT_DIR" && timeout 300 claude -p "$(cat <<RECOVERY_EOF
上一次迭代失败了。以下是最近的错误日志:
$last_error

读取 .autopilot/TASK_NOTES.md 了解上下文。
诊断问题并修复。运行 cd apps/web && pnpm build 验证。
更新 .autopilot/TASK_NOTES.md 记录出了什么问题。
RECOVERY_EOF
)" --model "$CLAUDE_MODEL" \
   --allowedTools "Read,Write,Edit,Bash,Grep,Glob" \
   --permission-mode bypassPermissions \
   > "$LOG_DIR/recovery_$(date +%s).log" 2>&1) || true
}

run_escalation() {
  local phase=$1
  local stale_count=$2
  log_warn "连续 $stale_count 次无进展，尝试换策略..."

  (cd "$PROJECT_DIR" && timeout 300 claude -p "$(cat <<ESCALATION_EOF
你在 Phase $phase 已经 $stale_count 次迭代没有产生有意义的代码变更。

读取 .autopilot/TASK_NOTES.md 和 .autopilot/phase_prompts/phase_${phase}.md 了解上下文。

你必须做以下之一:
(a) 找到阻碍原因，采取完全不同的方法来推进
(b) 如果确实无法继续，在 .autopilot/TASK_NOTES.md 中写 STUCK: <原因>

不要重复之前的方法。想一个新的切入点。
ESCALATION_EOF
)" --model "$CLAUDE_MODEL" \
   --allowedTools "Read,Write,Edit,Bash,Grep,Glob" \
   --permission-mode bypassPermissions \
   > "$LOG_DIR/escalation_$(date +%s).log" 2>&1) || true
}

# --- De-sloppify 清理 ---
run_desloppify() {
  local phase=$1
  log "运行 de-sloppify 清理..."

  (cd "$PROJECT_DIR" && timeout 300 claude -p "$(cat <<DESLOP_EOF
审查 PixelTown 项目中 Phase $phase 期间的所有改动。

删除:
- 测试中验证语言/框架行为而非业务逻辑的部分
- TypeScript 已保证的冗余类型检查
- 不可能状态的过度防御性错误处理
- console.log 语句
- 注释掉的代码
- 未使用的导入
- 不必要的类型断言

保留所有业务逻辑测试和有意义的错误处理。

清理后运行: cd apps/web && pnpm build && pnpm lint
修复清理引入的任何问题。
commit: git add -A && git commit -m "refactor(phase-$phase): de-sloppify cleanup"
DESLOP_EOF
)" --model "$CLAUDE_MODEL" \
   --allowedTools "Read,Write,Edit,Bash,Grep,Glob" \
   --permission-mode bypassPermissions \
   > "$LOG_DIR/desloppify_phase${phase}.log" 2>&1) || true
}

# --- Git push ---
git_push_phase() {
  local phase=$1
  log "推送 Phase $phase 到 GitHub..."
  if (cd "$PROJECT_DIR" && git push origin main 2>&1); then
    log_success "推送成功"
  else
    log_warn "推送失败，继续执行（不影响下一阶段）"
  fi
}

# --- 阶段推进 ---
advance_phase() {
  local prev_phase
  prev_phase=$(get_state_field currentPhase 0)
  local next_phase=$((prev_phase + 1))
  local completed
  completed=$(get_state_field completedPhases "[]")

  # 更新 completed 列表
  local new_completed
  new_completed=$(python3 -c "
import json
lst = json.loads('$completed')
lst.append($prev_phase)
print(json.dumps(lst))
")

  update_state \
    currentPhase "$next_phase" \
    phaseIteration 0 \
    staleCount 0 \
    consecutiveFailures 0 \
    completedPhases "$new_completed"

  # 追加进度
  echo "" >> "$PROGRESS_FILE"
  echo "## Phase $prev_phase 完成 — $(date '+%Y-%m-%d %H:%M')" >> "$PROGRESS_FILE"

  log_phase "Phase $prev_phase 完成！推进到 Phase $next_phase"
}

# --- 主循环 ---
main() {
  mkdir -p "$LOG_DIR"

  # 初始化时间戳
  local started_at
  started_at=$(get_state_field startedAt "")
  if [[ -z "$started_at" || "$started_at" == "None" || "$started_at" == "" ]]; then
    update_state startedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  fi

  log_phase "PixelTown Autopilot 启动"
  log "读取状态..."

  local current_phase global_iter phase_iter stale_count consecutive_failures

  while true; do
    # 每次循环重新读取状态
    current_phase=$(get_state_field currentPhase 0)
    global_iter=$(get_state_field globalIteration 0)
    phase_iter=$(get_state_field phaseIteration 0)
    stale_count=$(get_state_field staleCount 0)
    consecutive_failures=$(get_state_field consecutiveFailures 0)

    log "状态: phase=$current_phase, global=$global_iter, phaseIter=$phase_iter, stale=$stale_count, fails=$consecutive_failures"

    # === 终止条件 ===

    # 所有阶段完成
    if [[ $current_phase -ge $TOTAL_PHASES ]]; then
      log_phase "🎉 所有阶段完成！PixelTown 已就绪！"
      echo "" >> "$PROGRESS_FILE"
      echo "## 🎉 项目完成 — $(date '+%Y-%m-%d %H:%M')" >> "$PROGRESS_FILE"
      update_state status "completed"

      # 最终推送
      (cd "$PROJECT_DIR" && git push origin main 2>&1) || true
      break
    fi

    # 全局迭代上限
    if [[ $global_iter -ge $GLOBAL_MAX_ITERATIONS ]]; then
      log_error "达到全局迭代上限 ($GLOBAL_MAX_ITERATIONS)，停止。"
      update_state status "max_iterations_reached"
      break
    fi

    # 阶段迭代上限
    local max_iter=${PHASE_MAX_ITERATIONS[$current_phase]}
    if [[ $phase_iter -ge $max_iter ]]; then
      log_warn "Phase $current_phase 达到上限 ($max_iter 次迭代)"

      # 最后尝试一次质量门 + 验收检查
      if run_quality_gates "$current_phase"; then
        if check_phase_completion "$current_phase"; then
          run_desloppify "$current_phase"
          git_push_phase "$current_phase"
          advance_phase
          continue
        fi
      fi

      # 跳过这个阶段，继续下一个（而非停下来等人）
      log_warn "Phase $current_phase 超限未完成，强制推进到下一阶段"
      echo "" >> "$PROGRESS_FILE"
      echo "## Phase $current_phase 超限跳过 — $(date '+%Y-%m-%d %H:%M')" >> "$PROGRESS_FILE"
      git_push_phase "$current_phase"
      advance_phase
      continue
    fi

    # === 执行一次迭代 ===
    local iter_result=0
    run_phase_iteration "$current_phase" "$phase_iter" || iter_result=$?

    # 更新计数
    global_iter=$((global_iter + 1))
    phase_iter=$((phase_iter + 1))
    update_state globalIteration "$global_iter" phaseIteration "$phase_iter"

    case $iter_result in
      0) # 成功 + 有变更
        update_state staleCount 0 consecutiveFailures 0

        # 运行质量门
        if run_quality_gates "$current_phase"; then
          # 检查阶段是否完成
          if check_phase_completion "$current_phase"; then
            run_desloppify "$current_phase"
            git_push_phase "$current_phase"
            advance_phase
          else
            log "阶段尚未完成，继续迭代..."
          fi
        else
          log_warn "质量门未通过，下次迭代将尝试修复"
        fi
        ;;

      1) # 执行失败
        consecutive_failures=$((consecutive_failures + 1))
        update_state consecutiveFailures "$consecutive_failures"

        if [[ $consecutive_failures -ge $MAX_CONSECUTIVE_FAILURES ]]; then
          log_error "连续 $MAX_CONSECUTIVE_FAILURES 次失败"
          # 自动尝试恢复而非停止
          run_recovery "$current_phase"
          update_state consecutiveFailures 0  # 重置，给恢复一个机会
        else
          run_recovery "$current_phase"
        fi
        ;;

      2) # 停滞（无变更）
        stale_count=$((stale_count + 1))
        update_state staleCount "$stale_count"

        if [[ $stale_count -ge $STALE_THRESHOLD ]]; then
          run_escalation "$current_phase" "$stale_count"

          # 检查是否声明 STUCK
          if grep -q "STUCK:" "$TASK_NOTES" 2>/dev/null; then
            log_error "Claude 声明 STUCK，强制推进到下一阶段"
            # 清除 STUCK 标记
            sed -i '' 's/STUCK:/RESOLVED_STUCK:/g' "$TASK_NOTES" 2>/dev/null || true
            git_push_phase "$current_phase"
            advance_phase
          else
            update_state staleCount 0  # 重置，给新策略一个机会
          fi
        fi
        ;;
    esac

    # 迭代间短暂休息（避免 API 限流）
    sleep 5
  done

  log_phase "Supervisor 退出"
  log "最终状态: phase=$(get_state_field currentPhase 0), globalIter=$(get_state_field globalIteration 0), status=$(get_state_field status running)"
}

main "$@"

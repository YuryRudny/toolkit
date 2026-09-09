# Исполняемый контракт и обновление существующих установок

Этот документ описывает текущий runtime-контракт. Он уточняет старые installation examples; quality rubric остаётся ориентиром ручного review, а не доказательством качества, вычисляемым по длине текста.

## Обслуживание toolkit

При разработке самого toolkit рабочий корень содержит `scripts/bootstrap.js`, `MANIFEST.md` и `skills/project-agent-bootstrap/SKILL.md`. Не запускай install wizard и не создавай generated skills/RAG внутри исходников компилятора. Проверка: `node tests/run-all-tests.js` (Node.js 22+, Git, Bash; без npm install). Тесты создают временные Git-репозитории; enterprise suite использует только локальные HTTP-серверы на 127.0.0.1.

CI проверяет Node.js 22/24 на Linux/macOS. Actions закреплены на commit SHA из [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) и [setup-node v7.0.0](https://github.com/actions/setup-node/releases/tag/v7.0.0). Добавление workflow не означает, что удалённый CI уже прошёл.

## Research evidence

Команда `complete-research-task` теперь принимает путь к JSON evidence-record внутри artifact/project root либо inline JSON. Например, из target root:

```bash
node reusable-agent-system-toolkit/scripts/bootstrap.js complete-research-task . R-001 docs/agent-system/research-workspace/inventory-evidence.json
```

Record содержит:

```json
{
  "summary": "Что прочитано и какой вывод подтверждён",
  "scope": ["src"],
  "coverage": ["module responsibilities", "ownership boundaries", "deeper reads"],
  "sources": [{"path": "src/main.js"}]
}
```

`scope` покрывает scope конкретной задачи, `coverage` — её requiredEvidence. Каждый source должен существовать и быть файлом внутри разрешённого репозитория. Для sidecar используй `repo://repository-id/path`. Команда сама добавляет fingerprint источника. Это проверка полноты и свежести ссылок, не автоматическое доказательство правдивости summary; результаты исследования необходимо review-ить.

`skip-research-task` требует явную причину неприменимости. `complete-research-evidenced` только проверяет уже закрытые задачи: он больше не закрывает их массово по наличию длинных документов. Изменение source fingerprint возвращает задачи в pending, сохраняя старые записи как устаревшие. Повторный discovery без изменения содержимого сохраняет responsibility/evidence/flowIds.

## Генерация и сохранность локальных правил

Full generation требует initialized state, installMode=full, завершённую фазу docs-rag, существующие документы, актуальный research и resolved authority inventory. Прямой вызов renderer не обходит gate. Blocked state запрещает генерацию и завершение фаз.

`generated-ownership.json` хранит хеши управляемых файлов. Renderer проверяет весь план до первой записи, затем атомарно заменяет каждый файл. Это не транзакция над всеми файлами при аварии диска и не защита от враждебной конкурентной подмены файлов другой программой. Пользовательские изменения и чужие skills не перезаписываются; при конфликте команда останавливается. В AGENTS.md изменяется только managed-блок, внешние правила сохраняются.

Для старой установки без ownership manifest сначала проверь diff, сохрани нужные локальные правила и получи явное разрешение владельца на дальнейшую генерацию данного файла. После этого можно принять управление одним файлом с объяснением:

```bash
node reusable-agent-system-toolkit/scripts/bootstrap.js adopt-output . codex-skills/skills/review-checklist/SKILL.md "Владелец разрешил заменить проверенную старую generated-версию; локальные правила перенесены в authority"
```

Команда не меняет содержимое, но разрешает его замену следующим renderer-запуском. Не применяй её автоматически для обхода конфликта. Конфликты одинаковых skill names между разными путями требуют явного merge/routing решения; автоматическое смысловое слияние правил не поддерживается.

## Рендеринг

Исполняемый layout — `templates/skills/compiled-skill.template.md`; обязательные слоты `{{HEADER}}` и `{{SECTIONS}}` встречаются по одному разу. Код собирает секции из structured inputs, а файл задаёт внешний layout. Изменение layout влияет на следующий render. Старые role-specific `.full.template.md` — design references для автора input, не второй исполняемый renderer. Поле `targetTemplate` сохранено как ссылка на такой reference; assembly явно различает его и render template.

`workflowSteps` берутся из input без подмены hardcoded workflow. Seed rules/adaptation не заменяются выводами из имени seed. Sidecar commands выводятся только из реально обнаруженных package scripts; задачи Gradle/Maven/Python нельзя выдумывать — добавляй проверенные команды в input после исследования. `repo://` сначала разрешается через workspace manifest и не передаётся напрямую в rg.

Повторный create-skill-inputs не стирает authored drafts. При изменении модели он сохраняет поля, снимает ready и записывает discoveryUpdate. После re-adaptation явно обнови projectFingerprint; устаревший input не рендерится.

Если подтверждённых localRisks или применимых criticalFlows действительно нет, не выдумывай строки для score. Допускается пустой массив с `sectionExemptions.<field> = {"reason": "обоснование", "evidence": ["путь к проверенному файлу"]}`. Renderer показывает это объяснение, validator проверяет ссылки. Неприменимость всё равно требует ручной оценки по scope.

## Приёмка и repair

Порядок: runtime (для sidecar) → quality-report → validate → check-bootstrap-state. JSON quality report пересчитывается из артефактов; Markdown служит представлением. Каждая категория 0/10 или 10/10 отражает исполняемые условия. Нет квот на количество рисков, строк или flows. Общие 10/10 означают выполнение проверяемого контракта, а не отсутствие багов или «доказанный senior-уровень».

Validation требует state, nonempty task graph, обязательные документы и skills, актуальное evidence, совпадающие input/output identities и JSON scorecard. Validation result содержит fingerprints артефактов и исходников; изменение любого из них запрещает завершить bootstrap по старому passed result.

Для исправлений: `bootstrap.js repair-phase . <phase>` возвращает к текущей или более ранней фазе, инвалидируя последующие completions. `block`/`unblock` не заменяют evidence gates. Degraded mode проходит сокращённую цепочку и не создаёт full roles; результат явно сообщает, что deep research недоступен.

## Sidecar и enterprise

Update preflight JSON v3 требует `--mode full|incremental`, иначе возвращает `needs-update-mode` и варианты для пользователя. Отдельное поле `separationStatus` сохраняет результат проверки хранения. В Full для проверенного storage строится read-only candidate plan: rebuild skills/RAG, retire старой рабочей истории, preserve MCP/config/runtime/intent, review неизвестного и symlinks. Credentials/config directories и rollback history не читаются рекурсивно. Plan не является разрешением удалить файлы и не доказывает ownership: вложенные настройки в обычных RAG/skills проверяет агент. Automatic deletion=false, автоматического deep scan/rebuild/apply нет. Полная пересборка и активация следуют [full-update.md](full-update.md); до сноса нужны поддержанный compiler workflow, fresh evidence, проверенный checkpoint и сохранность MCP. Incremental не строит reset plan.

Обновление существующей установки маршрутизируется через `project-agent-update` / generated `agent-system-update`. `bootstrap.js update <root> --check` выполняет read-only separation inventory до research и записей, учитывает index и worktree, известные ignored agent paths и не следует symlinks. Неразмеченные клиентские AGENTS.md сохраняются; известные toolkit paths и managed-блоки требуют проверки владения/переноса, неизвестные skills возвращаются как review candidates. Неизвестные layouts и смысловая полнота требуют агентского review. Нулевой exit code не означает актуальность всей RAG или успешное обновление установленной версии. Автоматического `--apply` пока нет.

`commit-plan` проверяет известные toolkit artifacts в Git-кандидатах (включая index), а не запрещает любой клиентский AGENTS.md по имени. Review candidates выводятся отдельно и требуют решения о владении перед публикацией; `ready` не заменяет этот review. Игнорируемые материалы проверяются update preflight, а не Git commit-plan.

Правило [repository-separation.md](repository-separation.md) требует сначала выбор пользователя: artifact Git или локальная non-Git папка. Парные MR применимы только к Git storage и запрошенному push. Только согласованный cleanup допускает перечисленные в плане изменения customer worktree с сохранением продукта/клиентских правил. До post-migration snapshot проверь cleanup diff по allowlist; не скрывай его обновлением baseline. Перенос не разрешает публикацию, изменение credentials или переписывание истории.

Local storage имеет `agent-storage.json` (schemaVersion=1, mode=local, publication=never, явные абсолютные customer/toolkit paths) и `.gitignore` с единственным правилом `*`. Loader запрещает storage внутри Git, смешанный workspace.json/remote и пересечение roots. Preflight возвращает выбор git/local вместо обязательного remote; `cleanup-pending` означает оставшиеся только в index/HEAD артефакты, а не разрешение их stage/commit. Source URI resolution и `render-workspace-runtime` поддерживают local manifest. Local agentctl не проходит в Git-backed install/sync/integrations/публикацию; status/doctor/commit-plan/update --mode ... --check остаются read-only. Полный bootstrap/model compiler для local пока не адаптирован; Full preflight доступен, но недоступный rebuild workflow блокирует активацию/удаление. Детали — [local-agent-storage.md](local-agent-storage.md).

Manifest требует отдельные Git-корни artifact/customer/toolkit, явные remotes и доступный toolkit bootstrap. Source guard хеширует Git-index и содержимое tracked/untracked (не ignored) файлов. HEAD-only и status-only сравнение недостаточно. Исторический snapshot без digest даёт unknown, а dirty content — stale. Ignored build/cache files не входят в source boundary guard.

Запись через symlink-предков за пределы artifact root запрещена. `agentctl install` не создаёт локальные integration symlinks внутри customer repositories. Local env config разрешён только в ignored/untracked `.local/*.json`. Configure Git credentials может менять только соответствующие `.git/config` по явно запрошенному enterprise setup; customer worktree остаётся read-only.

HTTP deadline действует до конца чтения тела, размер ограничивается в процессе streaming; redirects отключены. Оборванное тело не считается успешным JSON. TLS включён по умолчанию; явное legacy-исключение допустимо только для exact GitLab origin из manifest. Git doctor проверяет чтение remote, не право push. Ограниченный обход linked context возвращает partial/truncated, а не ложный complete.

Seed integrity подтверждает неизменность локального snapshot. Она не доказывает upstream-происхождение и не заменяет review импортированной библиотеки; существующая provenance остаётся ограниченной метаданными импорта.

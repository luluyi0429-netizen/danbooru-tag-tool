// ==UserScript==
// @name         Danbooru Tag Tool
// @namespace    local.danbooru-tag-tool
// @version      2.0.0
// @description  Filter appearance tags, preview decisions, and save personal tag exceptions.
// @match        https://danbooru.donmai.us/posts/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  const categoryNames = {
    hair:'头发', eyes:'眼睛', face:'脸部', skin:'肤色', body:'体型', species:'身体设定',
    identity:'角色 / 作品 / 人数', clothing:'服装', accessories:'饰品', expression:'表情',
    pose:'姿势 / 动作', artist:'画师', meta:'其他元信息', scene:'场景 / 构图'
  };
  const appearance = ['hair','eyes','face','skin','body','species'];
  const presets = {
    none:[], appearance,
    identity:[...appearance,'identity'],
    scene:[...appearance,'identity','clothing','accessories','expression','pose','artist']
  };
  const dictionary = Object.create(null);
  function register(category, words) {
    for (const tag of words.split(/\s+/).filter(Boolean)) dictionary[tag] = category;
  }
  register('hair', 'bald bangs asymmetrical_bangs blunt_bangs swept_bangs parted_bangs sidelocks ahoge antenna_hair cowlick hair_over_one_eye hair_over_eyes hair_between_eyes hair_behind_ear hair_intakes hair_flaps hair_slicked_back hair_pulled_back hair_spread_out hair_tucking braid braids single_braid twin_braids side_braid french_braid crown_braid ponytail high_ponytail low_ponytail side_ponytail twintails low_twintails short_twintails hair_bun double_bun single_hair_bun two_side_up one_side_up bob_cut hime_cut pixie_cut dreadlocks cornrows undercut widow\'s_peak temporal_hairline streaked_hair split-color_hair two-tone_hair multicolored_hair gradient_hair rainbow_hair colored_inner_hair roots');
  register('eyes', 'heterochromia slit_pupils white_pupils black_pupils colored_pupils bright_pupils horizontal_pupils no_pupils symbol-shaped_pupils heart-shaped_pupils star-shaped_pupils ringed_eyes empty_eyes glowing_eyes mismatched_sclera black_sclera colored_sclera colored_eyelashes long_eyelashes eyelashes thick_eyebrows thin_eyebrows eyebrows eyebrows_visible_through_hair');
  register('face', 'freckles mole mole_under_eye mole_under_mouth facial_hair beard mustache goatee stubble scar scar_on_face scar_across_eye nose small_nose pointy_nose lips thick_lips fangs sharp_teeth buck_teeth facial_mark facial_tattoo beauty_mark dimples');
  register('skin', 'dark_skin dark-skinned_female dark-skinned_male tan tanned pale_skin fair_skin colored_skin white_skin black_skin blue_skin green_skin red_skin grey_skin gray_skin purple_skin pink_skin shiny_skin wet_skin');
  register('body', 'breasts small_breasts medium_breasts large_breasts huge_breasts gigantic_breasts flat_chest pectorals muscular muscular_female muscular_male abs toned biceps wide_hips narrow_waist thick_thighs thin slim fat plump chubby petite tall short height_difference long_legs long_neck broad_shoulders mature_female mature_male midriff navel thighs cleavage collarbone');
  register('species', 'animal_ears cat_ears dog_ears fox_ears wolf_ears rabbit_ears bunny_ears horse_ears bear_ears elf pointy_ears horns single_horn antlers tail cat_tail fox_tail wolf_tail dog_tail multiple_tails wings feathered_wings bat_wings angel_wings demon_wings scales fur claws monster_girl monster_boy kemonomimi');
  register('identity', 'solo solo_focus multiple_girls multiple_boys male_focus female_focus genderswap genderswap_(mtf) genderswap_(ftm) twins sisters brothers siblings');
  register('clothing', 'shirt skirt miniskirt dress coat jacket hoodie pants shorts jeans suit uniform school_uniform swimsuit bikini bra panties underwear thighhighs pantyhose socks gloves shoes boots sandals sneakers kimono yukata hakama apron necktie bowtie vest cape cloak collar collared_shirt hood sleeves long_sleeves short_sleeves sleeveless detached_sleeves striped_clothes plaid_clothes no_bra no_panties naked nude topless bottomless');
  register('accessories', 'hair_ornament hair_bow hair_ribbon hairband headband hairclip hair_flower hairpin hair_stick scrunchie ribbon bow jewelry earrings necklace bracelet ring choker glasses sunglasses hat cap beret tiara crown piercing ear_piercing hair_rings');
  register('expression', 'smile smiling grin laughing blush blushing nose_blush ear_blush crying tears sobbing pout pouting frown angry embarrassed expressionless surprised scared sleepy open_mouth closed_mouth parted_lips clenched_teeth tongue tongue_out drooling saliva sweat trembling');
  register('pose', 'looking_at_viewer looking_away looking_back looking_up looking_down closed_eyes half-closed_eyes wink winking blinking squinting rolling_eyes hand_in_own_hair hands_in_hair holding_hair grabbing_another\'s_hair holding_another\'s_hair hair_pull hair_tug arched_back arm_up arms_up arms_behind_back hand_up hands_up sitting standing lying kneeling crouching walking running jumping leaning reclining on_back on_side on_stomach crossed_legs crossed_arms crossed_hands legs_up spread_legs outstretched_arms hands_on_hips hand_on_hip head_tilt facing_viewer from_behind clothes_lift shirt_lift skirt_lift dress_lift hoodie_lift');
  register('scene', 'simple_background white_background black_background grey_background gray_background blue_background green_background red_background pink_background yellow_background purple_background transparent_background gradient_background outdoors indoors sky cloud clouds sunlight sunset night tree trees forest ocean beach room bedroom window wall against_wall blurry_background depth_of_field bokeh close-up upper_body full_body cowboy_shot portrait profile from_above from_below from_side dutch_angle wide_shot motion_blur motion_lines speed_lines backlighting rim_lighting');
  register('scene', 'from_behind');
  const rules = [
    ['hair', /^(?:very_)?(?:short|medium|long|absurdly_long|straight|wavy|curly|messy|spiky|fluffy|wet|floating|disheveled|black|brown|blonde|white|grey|gray|silver|red|orange|yellow|green|blue|purple|pink|aqua)_hair$/],
    ['eyes', /^(?:black|brown|blue|green|red|yellow|orange|pink|purple|aqua|grey|gray|silver|gold|amber|multicolored|two-tone)_eyes$/],
    ['identity', /^\d+(?:girl|girls|boy|boys|other|others)$/],
    ['clothing', /^(?:(?:black|white|grey|gray|brown|red|orange|yellow|green|blue|purple|pink|striped|plaid|lace-trimmed|frilled|sleeveless|collared|hooded|cropped|pleated|long|short|open|torn|school|military|sailor)_)+(?:shirt|skirt|dress|coat|jacket|hoodie|pants|shorts|suit|uniform|swimsuit|bikini|bra|panties|underwear|thighhighs|pantyhose|socks|gloves|shoes|boots|necktie|bowtie|vest|apron)$/],
    ['accessories', /^(?:silver|gold|black|white|red|green|blue|pink|purple|hoop|heart|star|cross)_(?:earrings|necklace|bracelet|ring|choker|ribbon|bow|hair_bow|hair_ribbon|hairclip)$/]
  ];
  // Exact exceptions are checked first so gaze, accessories, and backgrounds survive hair/eye filtering.
  function classify(tag, group) {
    if (group === 'Character' || group === 'Copyright') return { category:'identity', source:'网站分类' };
    if (group === 'Artist') return { category:'artist', source:'网站分类' };
    if (group === 'Meta') return { category:'meta', source:'网站分类' };
    if (dictionary[tag]) return { category:dictionary[tag], source:'词典' };
    for (const [category, pattern] of rules) if (pattern.test(tag)) return { category, source:'规则匹配' };
    return { category:'unknown', source:'未识别' };
  }

  const storageKey = 'danbooru-tag-tool:v2';
  function readSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return {
        filters:Array.isArray(saved?.filters) ? [...new Set(saved.filters.filter(key => Object.hasOwn(categoryNames, key)))] : [...appearance],
        overrides:saved?.overrides && typeof saved.overrides === 'object' && !Array.isArray(saved.overrides)
          ? Object.fromEntries(Object.entries(saved.overrides).filter(([,value]) => value === 'keep' || value === 'remove')) : {},
        scope:['general','prompt','all'].includes(saved?.scope) ? saved.scope : 'general',
        format:saved?.format === 'spaces' ? 'spaces' : 'original'
      };
    } catch { return { filters:[...appearance], overrides:{}, scope:'general', format:'original' }; }
  }
  const settings = readSettings();
  let storageAvailable = true;
  function saveSettings() {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); }
    catch { storageAvailable = false; }
  }

  const css = `
    #db-tag-tool { position: fixed; z-index: 99999; right: 18px; bottom: 64px; width: min(440px, calc(100vw - 36px)); max-height:calc(100dvh - 82px); display:flex; flex-direction:column; color: #202526;
      background: #fff; border: 1px solid #b7c5c2; border-radius: 6px; box-shadow: 0 8px 30px #0004;
      font: 14px/1.45 system-ui, sans-serif; overflow: hidden; }
    #db-tag-tool[hidden] { display:none; }
    #db-tag-tool * { box-sizing: border-box; letter-spacing:0; }
    #db-tag-tool .db-head { display:flex; justify-content:space-between; align-items:center; padding:10px 12px;
      background:#177e72; color:white; font-weight:700; }
    #db-tag-tool button { font:inherit; color: #fff; background:#177e72; border:1px solid #166e64; border-radius:4px; padding:6px 9px; cursor:pointer; }
    #db-tag-tool button:hover { background:#14685f; }
    #db-tag-tool button:disabled { opacity:.5; cursor:default; }
    #db-tag-tool .db-close { background:transparent; border:0; padding:0 4px; font-size:18px; }
    #db-tag-tool .db-actions { display:flex; gap:6px; flex-wrap:wrap; padding:9px 10px; border-bottom:1px solid #dce4e2; }
    #db-tag-tool .db-actions button { flex:1; }
    #db-tag-tool .db-scroll { min-height:0; overflow:auto; }
    #db-tag-tool .db-body { min-height:150px; max-height:300px; overflow:auto; padding: 4px 10px 10px; }
    #db-tag-tool details { border-bottom:1px solid #dce4e2; padding:7px 0; }
    #db-tag-tool summary { cursor:pointer; color:#274f47; font-weight:700; }
    #db-tag-tool .db-tags { white-space:pre-wrap; overflow-wrap:anywhere; color:#45514f; padding:6px 0 2px; }
    #db-tag-tool .db-status { color:#586b65; padding:9px 10px; font-size:12px; }
    #db-tag-tool textarea { width:100%; min-height:100px; color:#202526; background:#fff; }
    #db-tag-tool select { font:inherit; padding:5px; min-width:0; max-width:100%; color:#202526; background:#fff; border:1px solid #b7c5c2; border-radius:4px; }
    #db-tag-tool .db-config { padding:10px; border-bottom:1px solid #dce4e2; }
    #db-tag-tool .db-controls { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    #db-tag-tool .db-controls label,#db-tag-tool .db-command { display:grid; gap:3px; font-size:12px; color:#586b65; }
    #db-tag-tool .db-filters { display:grid; grid-template-columns:1fr 1fr; gap:7px; padding:8px 0; }
    #db-tag-tool .db-filters label { display:flex; align-items:center; gap:6px; font-size:13px; }
    #db-tag-tool input { accent-color:#177e72; }
    #db-tag-tool .db-tabs { display:flex; gap:4px; padding:8px 10px 0; }
    #db-tag-tool .db-tabs button { flex:1; padding:6px 4px; background:#edf2f0; border-color:#c9d6d1; color:#40574f; font-size:13px; }
    #db-tag-tool .db-tabs button[aria-selected=true] { background:#177e72; color:white; }
    #db-tag-tool .db-row { display:grid; grid-template-columns:minmax(0,1fr) 96px; gap:8px; align-items:center; padding:7px 0; border-bottom:1px solid #e3e9e6; }
    #db-tag-tool .db-tag { display:block; overflow-wrap:anywhere; font-size:13px; }
    #db-tag-tool .db-reason { display:block; color:#65746d; font-size:11px; overflow-wrap:anywhere; }
    #db-tag-tool .db-row select { font-size:12px; width:96px; }
    #db-tag-tool .db-stats { padding:8px 10px; font-size:12px; color:#586b65; }
    #db-tag-tool .db-empty { padding:16px 0; color:#65746d; }
    #db-tag-tool .db-status { flex-shrink:0; border-top:1px solid #dce4e2; background:#f5f7f6; }
    #db-tag-tool button:focus-visible,#db-tag-tool select:focus-visible { outline:2px solid #177e72; outline-offset:2px; }
    @media (max-width:430px) {
      #db-tag-tool .db-actions { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    #db-tag-launcher { position:fixed; z-index:99999; bottom:18px; right:18px; padding:9px 16px; border:1px solid #166e64; background:#177e72; color:white; border-radius:6px; cursor:pointer; }
  `;

  const groups = [
    ['Artist', 'tag_string_artist'],
    ['Copyright', 'tag_string_copyright'],
    ['Character', 'tag_string_character'],
    ['General', 'tag_string_general'],
    ['Meta', 'tag_string_meta']
  ];

  const id = location.pathname.match(/\/posts\/(\d+)/)?.[1];
  if (location.hostname !== 'danbooru.donmai.us' || !id) return alert('请在 Danbooru 单张图片帖子页使用。');
  const existing = document.getElementById('db-tag-tool');
  if (existing) { existing.hidden = false; return; }

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.id = 'db-tag-tool';
  panel.innerHTML = `
    <div class="db-head"><span>标签过滤 #${id} · v2</span><button class="db-close" title="收起" aria-label="收起">×</button></div>
    <div class="db-scroll">
      <div class="db-config">
        <div class="db-controls">
          <label>过滤预设<select data-setting="preset" aria-label="过滤预设"><option value="none">不过滤</option><option value="appearance">去外貌</option><option value="identity">去人物设定</option><option value="scene">场景与构图优先</option><option value="custom">自定义</option></select></label>
          <label>标签范围<select data-setting="scope" aria-label="标签范围"><option value="general">仅 General</option><option value="prompt">General + 角色 + 作品</option><option value="all">全部分类</option></select></label>
        </div>
        <details class="db-options"><summary>过滤类别</summary><div class="db-filters"></div></details>
        <div class="db-controls">
          <label>输出格式<select data-setting="format" aria-label="输出格式"><option value="original">保留下划线</option><option value="spaces">转换为空格</option></select></label>
          <div class="db-command"><span>个人例外</span><button data-action="reset" title="清除当前保存的逐标签例外">清空例外</button></div>
        </div>
      </div>
      <div class="db-actions"><button data-action="copy" disabled>复制过滤结果</button><button data-action="original" disabled>复制原始</button><button data-action="download" disabled>下载 TXT</button><button data-action="refresh">刷新</button></div>
      <div class="db-tabs" role="tablist" aria-label="标签预览"><button role="tab" data-view="keep" aria-selected="true">保留</button><button role="tab" data-view="remove" aria-selected="false">已过滤</button><button role="tab" data-view="original" aria-selected="false">原始</button></div>
      <div class="db-stats"></div><div class="db-body" role="tabpanel" aria-label="标签列表"></div>
    </div><div class="db-status" role="status">正在读取帖子 ${id}...</div>`;
  document.body.appendChild(panel);
  const launcher = document.createElement('button');
  launcher.id = 'db-tag-launcher';
  launcher.textContent = '标签';
  launcher.title = '打开或收起标签工具';
  launcher.onclick = () => { panel.hidden = !panel.hidden; };
  document.body.appendChild(launcher);

  let post;
  let view = 'keep';
  let rows = [];
  const $ = selector => panel.querySelector(selector);
  const setStatus = message => { $('.db-status').textContent = message + (storageAvailable ? '' : '（浏览器未允许保存设置）'); };
  for (const [category, name] of Object.entries(categoryNames)) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox'; input.dataset.category = category;
    input.checked = settings.filters.includes(category);
    label.append(input, document.createTextNode(name));
    $('.db-filters').append(label);
  }
  $('[data-setting="scope"]').value = settings.scope;
  $('[data-setting="format"]').value = settings.format;
  function syncPreset() {
    const match = Object.keys(presets).find(key => presets[key].length === settings.filters.length && presets[key].every(category => settings.filters.includes(category)));
    $('[data-setting="preset"]').value = match || 'custom';
    panel.querySelectorAll('[data-category]').forEach(input => { input.checked = settings.filters.includes(input.dataset.category); });
  }
  syncPreset();
  const tags = value => (value || '').split(/\s+/).filter(Boolean);
  const scopedGroups = () => settings.scope === 'all' ? groups : settings.scope === 'prompt'
    ? groups.filter(([name]) => ['General','Character','Copyright'].includes(name)) : groups.filter(([name]) => name === 'General');
  const present = tag => settings.format === 'spaces' ? tag.replaceAll('_', ' ') : tag;
  function evaluateRows() {
    rows = scopedGroups().flatMap(([group, key]) => tags(post[key]).map(tag => {
      const info = classify(tag, group);
      const override = Object.hasOwn(settings.overrides, tag) ? settings.overrides[tag] : undefined;
      return { tag, group, ...info, override, removed:override === 'remove' || (override !== 'keep' && settings.filters.includes(info.category)) };
    }));
  }
  const resultText = () => rows.filter(row => !row.removed).map(row => present(row.tag)).join(', ');
  const originalText = () => scopedGroups().map(([name,key]) => `${name}: ${tags(post[key]).join(', ')}`).join('\n');

  function render() {
    const body = panel.querySelector('.db-body');
    body.replaceChildren();
    evaluateRows();
    const kept = rows.filter(row => !row.removed);
    const removed = rows.filter(row => row.removed);
    const unknown = kept.filter(row => row.category === 'unknown' && !row.override);
    $('[data-view="keep"]').textContent = `保留 (${kept.length})`;
    $('[data-view="remove"]').textContent = `已过滤 (${removed.length})`;
    $('[data-view="original"]').textContent = `原始 (${rows.length})`;
    panel.querySelectorAll('[data-view]').forEach(button => { button.setAttribute('aria-selected', String(button.dataset.view === view)); });
    $('.db-stats').textContent = `${unknown.length} 个未识别标签已保留 · ${Object.keys(settings.overrides).length} 个个人例外`;
    $('[data-action="reset"]').disabled = !Object.keys(settings.overrides).length;
    const visible = view === 'original' ? rows : view === 'keep' ? kept : removed;
    for (const row of visible) {
      const item = document.createElement('div'); item.className = 'db-row'; item.dataset.tag = row.tag;
      const text = document.createElement('div');
      const name = document.createElement('span'); name.className = 'db-tag'; name.textContent = present(row.tag);
      const reason = document.createElement('span'); reason.className = 'db-reason';
      reason.textContent = `${row.group} · ${categoryNames[row.category] || '未识别'} · ${row.override ? (row.removed ? '个人例外：过滤' : '个人例外：保留') : row.source}`;
      text.append(name, reason);
      const select = document.createElement('select'); select.dataset.override = row.tag;
      select.setAttribute('aria-label', `标签 ${row.tag} 的例外规则`);
      for (const [value, label] of [['auto','自动'],['keep','始终保留'],['remove','始终过滤']]) {
        const option = document.createElement('option'); option.value = value; option.textContent = label; select.append(option);
      }
      select.value = row.override || 'auto';
      item.append(text, select); body.append(item);
    }
    if (!visible.length) { const empty = document.createElement('div'); empty.className = 'db-empty'; empty.textContent = '无标签'; body.append(empty); }
  }

  panel.addEventListener('change', event => {
    const target = event.target;
    if (target.dataset.category) settings.filters = [...panel.querySelectorAll('[data-category]:checked')].map(input => input.dataset.category);
    else if (target.dataset.override) {
      if (target.value === 'auto') delete settings.overrides[target.dataset.override];
      else settings.overrides[target.dataset.override] = target.value;
    } else if (target.dataset.setting === 'preset') {
      if (target.value !== 'custom') settings.filters = [...presets[target.value]];
    } else if (target.dataset.setting) settings[target.dataset.setting] = target.value;
    else return;
    saveSettings(); syncPreset(); if (post) render(); setStatus('设置已更新');
  });

  async function load() {
    post = null;
    setStatus('正在读取...');
    panel.querySelector('.db-body').replaceChildren();
    $('.db-stats').textContent = '';
    panel.querySelectorAll('[data-action]').forEach(b => { if (b.dataset.action !== 'reset') b.disabled = true; });
    try {
      const response = await fetch(`/posts/${id}.json`, { credentials: 'same-origin', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      post = await response.json();
      if (String(post.id) !== id || typeof post.tag_string_general !== 'string') throw new Error('帖子数据无效');
      render();
      setStatus('标签已读取');
      panel.querySelectorAll('[data-action]').forEach(b => { if (b.dataset.action !== 'reset') b.disabled = false; });
    } catch (error) {
      post = null;
      panel.querySelector('.db-body').replaceChildren();
      setStatus(`读取失败：${error.message}，请点击刷新重试。`);
    } finally {
      panel.querySelector('[data-action="refresh"]').disabled = false;
    }
  }

  async function copyText(text) {
    let area;
    try {
      if (typeof GM_setClipboard === 'function') GM_setClipboard(text, 'text');
      else {
        area = document.createElement('textarea');
        area.readOnly = true;
        area.value = text;
        panel.querySelector('.db-body').append(area);
        area.focus(); area.select();
        if (!document.execCommand('copy')) await navigator.clipboard.writeText(text);
      }
      area?.remove();
      setStatus('已复制到剪贴板');
    } catch {
      if (!area) {
        area = document.createElement('textarea'); area.value = text;
        panel.querySelector('.db-body').append(area);
      }
      area.focus(); area.select();
      setStatus('自动复制失败，文本已选中，请按 Ctrl+C');
    }
  }

  panel.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.classList.contains('db-close')) { panel.hidden = true; return; }
    if (button.dataset.view) { view = button.dataset.view; if (post) render(); return; }
    if (button.dataset.action === 'reset') { settings.overrides = {}; saveSettings(); if (post) render(); setStatus('个人例外已清空'); return; }
    if (button.dataset.action === 'refresh') return load();
    if (!post) return;
    if (button.dataset.action === 'copy') return copyText(resultText());
    if (button.dataset.action === 'original') return copyText(originalText());
    if (button.dataset.action === 'download') {
      const blob = new Blob([resultText()], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `danbooru-${id}-filtered-tags.txt`; panel.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setStatus('已发起 TXT 下载');
    }
  });

  load();
})();

const BASE = 'https://res.cloudinary.com/dkht5j3tw/image/upload';

export const PATHS = {
  // backgrounds
  BG_HOME: 'v1792915611/BG_HOME_t0bjhq.png',
  BG_CREATE: 'v1792915610/BG_CREATE_nsgx3s.png',
  BG_GENERATING: 'v1792915611/BG_GENERATING_pii1kt.png',
  BG_INVESTIGATION: 'v1792915608/BG_INVESTIGATION_biwbxt.png',
  BG_RESULT_SOLVED: 'v1792915608/BG_RESULT_SOLVED_jxum4a.png',
  BG_RESULT_FAILED: 'v1792915604/BG_RESULT_FAILED_to5pkd.png',
  // textures and logo
  TX_PARCHMENT: 'v1792915609/TX_PARCHMENT_b452fi.png',
  TX_DARK_PAPER: 'v1792915609/TX_DARK_PAPER_oapro5.png',
  TX_GRUNGE_MASK: 'v1792915606/TX_GRUNGE_MASK_ymp9pb.png',
  LOGO_MARK: 'v1792915605/LOGO_MARK_j2gbot.png',
  // suspects
  PORTRAIT_DEFAULT: 'v1792915598/comman-charcter-all_zqwywa.png',
} as const;

export const SCENE_PATHS = {
  mansion_resort: 'v1792915604/scene-mansion_resort_u7godf.png',
  night_train: 'v1792915604/scene-night_train_f0o2ch.png',
  campus_library: 'v1792915605/scene-campus_library_p6ty50.png',
  research_lab: 'v1792915602/scene-research_lab_uctquc.png',
  lake_resort: 'v1792915601/scene-lake_resort_tk5sni.png',
  locked_study: 'v1792915599/scene-locked_study_vzyezh.png',
  theatre: 'v1792915601/scene-theatre_rqrtoo.png',
  haveli: 'v1792915598/scene-haveli_kuwnk3.png',
} as const;

export const CLUE_PATHS = {
  physical_thread: 'v1792915596/physical_thread_dmtht1.png',
  physical_clasp: 'v1792915596/physical_clasp_uws7we.png',
  physical_footprints: 'v1792915595/physical_footprints_zbohdh.png',
  physical_key: 'v1792915595/physical_key_iusuij.png',
  physical_glass: 'v1792915593/physical_glass_lnfc9n.png',
  document_note: 'v1792915593/document_note_eb9d0k.png',
  document_ledger: 'v1792915593/document_ledger_vivvtf.png',
  document_schedule: 'v1792915592/document_schedule_ejyf54.png',
  document_receipt: 'v1792915590/document_receipt_irmgmi.png',
  digital_cctv: 'v1792915589/digital_cctv_co0ian.png',
  digital_phone: 'v1792915593/digital_phone_jztpwj.png',
  digital_laptop: 'v1792915590/digital_laptop_zcbb74.png',
  testimony_recorder: 'v1792915589/testimony_recorder_cwx8sg.png',
  testimony_corridor: 'v1792915588/testimony_corridor_akvmgg.png',
} as const;

export type AssetId = keyof typeof PATHS;
export type SceneKey = keyof typeof SCENE_PATHS;
export type ClueVisualKey = keyof typeof CLUE_PATHS | 'none';

export const SCENE_KEYS = Object.keys(SCENE_PATHS) as SceneKey[];
export const CLUE_VISUAL_KEYS = [...Object.keys(CLUE_PATHS), 'none'] as ClueVisualKey[];

const build = (path: string, width: number): string =>
  `${BASE}/f_auto,q_auto,w_${width}/${path}`;

export const asset = (id: AssetId, width = 1920): string => build(PATHS[id], width);
export const scene = (key: SceneKey, width = 1280): string => build(SCENE_PATHS[key], width);
export const clueImage = (key: ClueVisualKey, width = 800): string | null =>
  key === 'none' ? null : build(CLUE_PATHS[key], width);

// One place to change when more portraits exist.
export const resolvePortrait = (_suspect?: { id: string; gender?: string }): string =>
  asset('PORTRAIT_DEFAULT', 512);

export const SUSPECT_RING_COLORS = [
  '#FF6B1A', // s1 - Orange
  '#6FA8DC', // s2 - Steel blue
  '#E9D8B4', // s3 - Sand
  '#D98BA0', // s4 - Rose
  '#5FB8A8', // s5 - Teal
] as const;

export const getSuspectRingColor = (index: number): string => {
  return SUSPECT_RING_COLORS[index % SUSPECT_RING_COLORS.length];
};

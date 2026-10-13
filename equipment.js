// Equipment vocabulary and carrying limits, not a recommendation engine.
const weapon = (name, side = 'any') => ({name,side,kind:'equipment'});
const grenade = (name, kind, side = 'any') => ({name,side,kind});
export const equipment = {
  ak47:weapon('AK-47','T'), m4a1s:weapon('M4A1-S','CT'), m4a4:weapon('M4A4','CT'),
  galil:weapon('Galil AR','T'), famas:weapon('FAMAS','CT'), awp:weapon('AWP'),
  ssg08:weapon('SSG 08'), aug:weapon('AUG','CT'), sg553:weapon('SG 553','T'),
  scar20:weapon('SCAR-20','CT'), g3sg1:weapon('G3SG1','T'),
  mac10:weapon('MAC-10','T'), mp9:weapon('MP9','CT'), mp7:weapon('MP7'),
  mp5sd:weapon('MP5-SD'), ump45:weapon('UMP-45'), p90:weapon('P90'), bizon:weapon('PP-Bizon'),
  nova:weapon('Nova'), xm1014:weapon('XM1014'), mag7:weapon('MAG-7','CT'),
  sawedoff:weapon('Sawed-Off','T'), m249:weapon('M249'), negev:weapon('Negev'),
  glock:weapon('Glock-18','T'), usp:weapon('USP-S','CT'), p2000:weapon('P2000','CT'),
  p250:weapon('P250'), dualberettas:weapon('Dual Berettas'), deagle:weapon('Desert Eagle'),
  revolver:weapon('R8 Revolver'), tec9:weapon('Tec-9','T'), fiveseven:weapon('Five-SeveN','CT'),
  cz75:weapon('CZ75-Auto'), zeus:weapon('Zeus x27'),
  vest:weapon('Броня'), helmet:weapon('Шолом (за повної броні)'),
  vesthelmet:weapon('Броня + шолом'), kit:weapon('Набір для розмінування','CT'),
  flash:grenade('Світлошумова граната','flash'), smoke:grenade('Димова граната','smoke'),
  he:grenade('Осколкова граната','he'), decoy:grenade('Хибна граната','decoy'),
  molotov:grenade('Коктейль Молотова','fire','T'), incendiary:grenade('Запалювальна граната','fire','CT')
};

export function normalizePurchases(items, side) {
  if (!Array.isArray(items) || items.length > 10) throw Error('Invalid purchase list');
  const counts = new Map(); let grenades = 0;
  return items.map(item => {
    if (!item || typeof item.id !== 'string' || !Object.hasOwn(equipment,item.id)) throw Error('Unknown equipment ID');
    if (Object.hasOwn(item,'quantity') || Object.hasOwn(item,'count')) throw Error('Use one item per entry');
    const entry = equipment[item.id];
    if (entry.side !== 'any' && entry.side !== side) throw Error('Equipment unavailable on this side');
    if (!Number.isInteger(item.price) || item.price <= 0 || item.price > 16000) throw Error('Invalid price');
    const countKey = entry.kind === 'equipment' ? item.id : entry.kind;
    const count = (counts.get(countKey) || 0) + 1;
    counts.set(countKey,count);
    if (count > (entry.kind === 'flash' ? 2 : 1)) throw Error('Duplicate equipment or grenade type');
    if (entry.kind !== 'equipment' && ++grenades > 4) throw Error('More than four grenades');
    return {id:item.id,name:entry.name,price:item.price};
  });
}

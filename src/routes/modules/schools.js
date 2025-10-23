import { Router } from 'express';
import { query } from '../../db.js';
import { parsePagination } from '../../utils/pagination.js';

export const schoolsRouter = Router();

// GET /api/schools
schoolsRouter.get('/', async (req, res, next) => {
  try {
    const { q, department_id, municipality_id, sector, level_id, area_id, modality_id, schedule_id, plan_id, limit: rawLimit, no_limit } = req.query;
    const { limit, offset, page } = parsePagination(req.query);

    const filters = [];
    const params = [];

    // Solo establecimientos abiertos
    filters.push("s.status = 'ABIERTA'");

    if(q){
      filters.push('(s.name LIKE ? OR s.address_text LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if(department_id){
      filters.push('m.department_id = ?');
      params.push(department_id);
    }
    if(municipality_id){
      filters.push('s.municipality_id = ?');
      params.push(municipality_id);
    }
    if(sector){
      // map legacy 'publico' -> 'oficial'
      const sec = sector === 'publico' ? 'oficial' : sector;
      filters.push('sec.name = ?');
      params.push(sec);
    }
    if(req.query.sector_id){ filters.push('s.sector_id = ?'); params.push(req.query.sector_id); }
    if(level_id){ filters.push('s.level_id = ?'); params.push(level_id); }
    if(area_id){ filters.push('s.area_id = ?'); params.push(area_id); }
    if(modality_id){ filters.push('s.modality_id = ?'); params.push(modality_id); }
    if(schedule_id){ filters.push('s.schedule_id = ?'); params.push(schedule_id); }
    if(plan_id){ filters.push('s.plan_id = ?'); params.push(plan_id); }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const totalRows = await query(
      `SELECT COUNT(*) as c
       FROM schools s
       LEFT JOIN municipalities m ON m.municipality_id = s.municipality_id
       LEFT JOIN sectors sec ON sec.sector_id = s.sector_id
       ${where}`,
      params
    );
    const total = totalRows[0]?.c || 0;

    // Soporte para no limitar (ej. mapa): limit=0 o no_limit=1
    let lim = Number(limit) | 0; let off = Number(offset) | 0;
    const unlimited = (Number(rawLimit) === 0) || (String(rawLimit) === '0') || (Number(no_limit) === 1) || (String(no_limit).toLowerCase() === 'true');
    // Algunos entornos podrían comportarse raro sin LIMIT; asegura un límite alto cuando unlimited
    const limitClause = unlimited ? `LIMIT 100000` : `LIMIT ${lim} OFFSET ${off}`;
    const rows = await query(
      `SELECT s.school_id, s.name, sec.name AS sector, s.address_text,
              s.municipality_id, m.name AS municipality_name,
              lvl.name AS level_name, s.lat, s.lng,
              mc.lat AS muni_lat, mc.lng AS muni_lng
       FROM schools s
       LEFT JOIN municipalities m ON m.municipality_id = s.municipality_id
       LEFT JOIN municipality_centroids mc ON mc.municipality_id = m.municipality_id
       LEFT JOIN sectors sec ON sec.sector_id = s.sector_id
       LEFT JOIN levels lvl ON lvl.level_id = s.level_id
       ${where}
       ORDER BY s.name
       ${limitClause}`,
     params
   );

    const items = rows.map(r => toSchoolDto(r));
    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

// GET /api/schools/:id
schoolsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT s.school_id, s.name, s.address_text, s.phone, s.status,
              s.municipality_id, m.name AS municipality_name, d.name AS department_name,
              sec.name AS sector, lvl.name AS level_name, a.name AS area_name,
              mo.name AS modality_name, sc.name AS schedule_name, p.name AS plan_name,
              sup.full_name AS supervisor_name, dir.full_name AS director_name,
              s.lat, s.lng
       FROM schools s
       LEFT JOIN municipalities m ON m.municipality_id = s.municipality_id
       LEFT JOIN departments d ON d.department_id = m.department_id
       LEFT JOIN sectors sec ON sec.sector_id = s.sector_id
       LEFT JOIN levels lvl ON lvl.level_id = s.level_id
       LEFT JOIN areas a ON a.area_id = s.area_id
       LEFT JOIN modalities mo ON mo.modality_id = s.modality_id
       LEFT JOIN schedules sc ON sc.schedule_id = s.schedule_id
       LEFT JOIN plans p ON p.plan_id = s.plan_id
       LEFT JOIN supervisors sup ON sup.supervisor_id = s.supervisor_id
       LEFT JOIN directors dir ON dir.director_id = s.director_id
       WHERE s.school_id = ?`,
      [id]
    );
    const s = rows[0];
    if(!s) return res.status(404).json({ error: 'School not found' });
    const school = toSchoolDto(s);

    const reviews = await query(
      `SELECT review_id, user_full_name, rating, comment, cost
       FROM reviews WHERE school_id = ? ORDER BY review_id DESC`,
      [id]
    );
    school.reviews = reviews.map(r => ({
      review_id: r.review_id,
      rating: r.rating,
      comment: r.comment,
      cost: r.cost,
      user: { full_name: r.user_full_name }
    }));

    res.json(school);
  } catch (e) { next(e); }
});

function toSchoolDto(r){
  const dto = {
    school_id: r.school_id,
    name: r.name,
    sector: r.sector,
    address_text: r.address_text,
    level_name: r.level_name,
    municipality_id: r.municipality_id,
    municipality_name: r.municipality_name,
    municipality: { name: r.municipality_name },
    geom: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] }
  };
  if('muni_lat' in r && 'muni_lng' in r){
    dto.municipality.lat = Number(r.muni_lat);
    dto.municipality.lng = Number(r.muni_lng);
  }
  if('department_name' in r) dto.department_name = r.department_name;
  if('area_name' in r) dto.area_name = r.area_name;
  if('modality_name' in r) dto.modality_name = r.modality_name;
  if('schedule_name' in r) dto.schedule_name = r.schedule_name;
  if('plan_name' in r) dto.plan_name = r.plan_name;
  if('supervisor_name' in r) dto.supervisor_name = r.supervisor_name;
  if('director_name' in r) dto.director_name = r.director_name;
  if('phone' in r) dto.phone = r.phone;
  if('status' in r) dto.status = r.status;
  return dto;
}

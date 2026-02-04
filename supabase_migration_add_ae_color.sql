alter table aes add column if not exists color text;

with ordered as (
  select
    id,
    row_number() over (order by created_at asc nulls last, name asc) - 1 as rn
  from aes
)
update aes
set color = (
  array[
    '#CBD5E1',
    '#BFDBFE',
    '#A7F3D0',
    '#FED7AA',
    '#E9D5FF',
    '#FBCFE8',
    '#C7D2FE',
    '#BBF7D0',
    '#E2E8F0',
    '#DDD6FE'
  ]::text[]
)[(ordered.rn % 10) + 1]
from ordered
where aes.id = ordered.id
  and (aes.color is null or btrim(aes.color) = '');

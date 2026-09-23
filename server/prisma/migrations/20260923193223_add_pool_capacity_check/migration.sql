-- Database-level safety net: Bullet can never be overbooked (PRD section 4.5).
ALTER TABLE "Pool"
  ADD CONSTRAINT "check_pool_capacity"
  CHECK ("occupiedSeats" >= 0 AND "occupiedSeats" <= "maxCapacity");
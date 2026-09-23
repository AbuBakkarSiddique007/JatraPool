import { PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Starting JatraPool cast seeding...");

  // 1. Seed Driver: Jashim
  const jashim = await prisma.user.upsert({
    where: { phone: "+8801700000001" },
    update: {},
    create: {
      name: "Jashim",
      phone: "+8801700000001",
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Seed Vehicle: "Bullet" (Strictly 3 seats)
  const bullet = await prisma.vehicle.upsert({
    where: { id: "bullet-vehicle-id-001" },
    update: {},
    create: {
      id: "bullet-vehicle-id-001",
      driverId: jashim.id,
      name: "Bullet",
      model: "Dhaka Tesla 3-Wheeler",
      totalCapacity: 3,
      registrationNumber: "DHK-TESLA-001",
    },
  });

  // 3. Seed Passenger 1: Nusrat (Banani -> Mohakhali)
  const nusrat = await prisma.user.upsert({
    where: { phone: "+8801700000002" },
    update: {},
    create: {
      name: "Nusrat",
      phone: "+8801700000002",
      role: UserRole.PASSENGER,
      status: UserStatus.ACTIVE,
    },
  });

  // 4. Seed Passenger 2: Rafiq (Banani -> Gulshan 1)
  const rafiq = await prisma.user.upsert({
    where: { phone: "+8801700000003" },
    update: {},
    create: {
      name: "Rafiq",
      phone: "+8801700000003",
      role: UserRole.PASSENGER,
      status: UserStatus.ACTIVE,
    },
  });

  // 5. Seed Passenger 3: Shirin (Contending for 3rd seat)
  const shirin = await prisma.user.upsert({
    where: { phone: "+8801700000004" },
    update: {},
    create: {
      name: "Shirin",
      phone: "+8801700000004",
      role: UserRole.PASSENGER,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`[Seed] Created Driver: ${jashim.name} with vehicle: ${bullet.name} (Capacity: ${bullet.totalCapacity})`);
  
  console.log(`[Seed] Created Passengers: ${nusrat.name}, ${rafiq.name}, ${shirin.name}`);
  console.log("[Seed] Seeding completed successfully! 🚀");
}

main()
  .catch((e) => {
    console.error("[Seed] Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

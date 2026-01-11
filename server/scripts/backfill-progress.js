import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getRankForLevel = (level) => {
  if (level >= 95) return "Ascended";
  if (level >= 88) return "Eternal Architect";
  if (level >= 81) return "Mythkeeper";
  if (level >= 73) return "Chronosmith";
  if (level >= 65) return "Exemplar";
  if (level >= 58) return "Luminary";
  if (level >= 51) return "Mythforged";
  if (level >= 43) return "Paragon";
  if (level >= 35) return "Architect";
  if (level >= 28) return "Ascendant";
  if (level >= 21) return "Warden";
  if (level >= 13) return "Pathforger";
  if (level >= 8) return "Adept";
  if (level >= 4) return "Initiate";
  return "Ember";
};

const run = async () => {
  const users = await prisma.user.findMany({
    select: { id: true },
  });
  let created = 0;
  for (const user of users) {
    const existing = await prisma.userProgress.findUnique({
      where: { userId: user.id },
    });
    if (existing) continue;
    await prisma.userProgress.create({
      data: {
        userId: user.id,
        xpTotal: 0,
        level: 1,
        forgeCoins: 0,
        rank: getRankForLevel(1),
      },
    });
    created += 1;
  }
  console.log(`Backfill complete. Created ${created} progress rows.`);
};

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

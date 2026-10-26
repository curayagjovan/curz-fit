import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.exercise.createMany({
    data: [
      { name: "Barbell Squat", muscleGroup: "LEGS", equipment: "Barbell" },
      { name: "Bench Press", muscleGroup: "CHEST", equipment: "Barbell" },
      { name: "Deadlift", muscleGroup: "BACK", equipment: "Barbell" },
      { name: "Overhead Press", muscleGroup: "SHOULDERS", equipment: "Barbell" },
      { name: "Pull-up", muscleGroup: "BACK", equipment: "Bodyweight" },
      { name: "Plank", muscleGroup: "CORE", equipment: "Bodyweight" },
      { name: "Treadmill Run", muscleGroup: "CARDIO", equipment: "Treadmill" },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

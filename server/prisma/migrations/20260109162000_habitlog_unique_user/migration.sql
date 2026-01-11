-- DropIndex
DROP INDEX "HabitLog_habitId_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "HabitLog_userId_habitId_date_key" ON "HabitLog"("userId", "habitId", "date");

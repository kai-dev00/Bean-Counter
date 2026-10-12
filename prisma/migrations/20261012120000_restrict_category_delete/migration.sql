-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_categoryId_fkey";

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


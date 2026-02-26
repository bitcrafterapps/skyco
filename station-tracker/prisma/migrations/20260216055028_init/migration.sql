-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "current_station" TEXT NOT NULL DEFAULT 'basket',
    "status" TEXT NOT NULL DEFAULT 'Producible',
    "is_rush" BOOLEAN NOT NULL DEFAULT false,
    "ship_date" TEXT,
    "sale_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sidemark" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "target" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_station_status" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "station" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "done_at" TEXT,
    "hold" BOOLEAN NOT NULL DEFAULT false,
    "hold_reason" TEXT NOT NULL DEFAULT '',
    "missing" BOOLEAN NOT NULL DEFAULT false,
    "missing_details" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "order_station_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "station" TEXT,
    "field_changed" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_current_station_idx" ON "orders"("current_station");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_is_rush_idx" ON "orders"("is_rush");

-- CreateIndex
CREATE INDEX "orders_ship_date_idx" ON "orders"("ship_date");

-- CreateIndex
CREATE INDEX "orders_order_number_idx" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "order_station_status_order_id_idx" ON "order_station_status"("order_id");

-- CreateIndex
CREATE INDEX "order_station_status_station_idx" ON "order_station_status"("station");

-- CreateIndex
CREATE INDEX "order_station_status_done_at_idx" ON "order_station_status"("done_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_station_status_order_id_station_key" ON "order_station_status"("order_id", "station");

-- CreateIndex
CREATE INDEX "audit_log_order_id_idx" ON "audit_log"("order_id");

-- CreateIndex
CREATE INDEX "audit_log_changed_at_idx" ON "audit_log"("changed_at");

-- AddForeignKey
ALTER TABLE "order_station_status" ADD CONSTRAINT "order_station_status_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

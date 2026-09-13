require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {
    res.json({
        message: "Kisan Setu Backend is running successfully 🌾"
    });
});

/* =====================================================
   TEST DATABASE
===================================================== */

app.get("/api/test-db", (req, res) => {
    db.query("SELECT 1 AS test", (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        res.json({
            message: "Database is working successfully ✅",
            result
        });
    });
});

/* =====================================================
   REGISTER
===================================================== */

app.post("/api/register", (req, res) => {
    const { name, mobile, password } = req.body;

    if (!name || !mobile || !password) {
        return res.status(400).json({
            message: "Name, mobile and password are required"
        });
    }

    const sql = `
        INSERT INTO users
        (name, mobile, password, role)
        VALUES (?, ?, ?, 'farmer')
    `;

    db.query(sql, [name, mobile, password], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Mobile number already registered"
                });
            }

            return res.status(500).json({
                message: "Registration failed",
                error: err.message
            });
        }

        res.status(201).json({
            message: "Registration successful ✅",
            farmer_id: result.insertId
        });
    });
});

/* =====================================================
   LOGIN
===================================================== */

app.post("/api/login", (req, res) => {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
        return res.status(400).json({
            message: "Mobile number and password are required"
        });
    }

    const sql = `
        SELECT id, name, mobile, role
        FROM users
        WHERE mobile = ?
        AND password = ?
        LIMIT 1
    `;

    db.query(sql, [mobile, password], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Login failed",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid mobile number or password"
            });
        }

        res.json({
            message: "Login successful ✅",
            farmer: results[0]
        });
    });
});

/* =====================================================
   ADD CROP
===================================================== */

app.post("/api/crops", (req, res) => {
    const {
        farmer_id,
        crop_name,
        crop_variety,
        quantity,
        unit
    } = req.body;

    if (
        !farmer_id ||
        !crop_name ||
        !crop_variety ||
        quantity === undefined ||
        quantity === null
    ) {
        return res.status(400).json({
            message:
                "Farmer ID, crop name, crop variety and quantity are required"
        });
    }

    const numericQuantity = Number(quantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({
            message: "Quantity must be greater than zero"
        });
    }

    const sql = `
        INSERT INTO crops
        (
            farmer_id,
            crop_name,
            crop_variety,
            quantity,
            unit
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            farmer_id,
            crop_name,
            crop_variety,
            numericQuantity,
            unit || "kg"
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to add crop",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Crop added successfully ✅",
                crop_id: result.insertId
            });
        }
    );
});

/* =====================================================
   GET FARMER CROPS
===================================================== */

app.get("/api/crops/:farmer_id", (req, res) => {
    const farmerId = req.params.farmer_id;

    const sql = `
        SELECT
            id,
            farmer_id,
            crop_name,
            crop_variety,
            quantity,
            unit,
            created_at
        FROM crops
        WHERE farmer_id = ?
        ORDER BY id DESC
    `;

    db.query(sql, [farmerId], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to load crops",
                error: err.message
            });
        }

        res.json(results);
    });
});

/* =====================================================
   GET CENTRES
===================================================== */

app.get("/api/centres", (req, res) => {
    const sql = `
        SELECT
            id,
            name,
            location,
            capacity,
            created_at
        FROM centres
        ORDER BY id ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to load centres",
                error: err.message
            });
        }

        res.json(results);
    });
});

/* =====================================================
   GET SLOTS
===================================================== */

app.get("/api/slots", (req, res) => {
    const sql = `
        SELECT
            s.id,
            s.centre_id,
            c.name AS centre_name,
            c.location,
            s.slot_date,

            TIME_FORMAT(
                ADDTIME(
                    '09:00:00',
                    SEC_TO_TIME(
                        (ROW_NUMBER() OVER (
                            PARTITION BY s.centre_id, s.slot_date
                            ORDER BY s.id
                        ) - 1) * 3600
                    )
                ),
                '%H:%i:%s'
            ) AS start_time,

            TIME_FORMAT(
                ADDTIME(
                    '09:00:00',
                    SEC_TO_TIME(
                        ROW_NUMBER() OVER (
                            PARTITION BY s.centre_id, s.slot_date
                            ORDER BY s.id
                        ) * 3600
                    )
                ),
                '%H:%i:%s'
            ) AS end_time,

            s.capacity,
            s.booked_count

        FROM slots s
        JOIN centres c
            ON s.centre_id = c.id

        ORDER BY
            s.slot_date ASC,
            s.centre_id ASC,
            s.id ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log("❌ Error fetching slots:", err.message);
            return res.status(500).json({
                message: "Failed to fetch slots",
                error: err.message
            });
        }

        res.json(results);
    });
});

/* =====================================================
   BOOK SLOT
   - CUSTOMIZABLE QUANTITY
   - GENERATE TOKEN
   - ADD TO QUEUE
===================================================== */

/* =====================================================
   BOOK SLOT
   - CUSTOMIZABLE QUANTITY
   - GENERATE TOKEN
   - ADD TO QUEUE
===================================================== */

app.post("/api/bookings", (req, res) => {
    const {
        farmer_id,
        crop_id,
        crop_variety,
        quantity,
        centre_id,
        slot_id
    } = req.body;

    if (
        !farmer_id ||
        !crop_id ||
        !crop_variety ||
        quantity === undefined ||
        quantity === null ||
        !centre_id ||
        !slot_id
    ) {
        return res.status(400).json({
            message:
                "Farmer, crop, crop variety, quantity, centre and slot are required"
        });
    }

    const bookingQuantity = Number(quantity);

    if (
        !Number.isFinite(bookingQuantity) ||
        bookingQuantity <= 0
    ) {
        return res.status(400).json({
            message: "Quantity must be greater than zero"
        });
    }

    db.getConnection((connectionError, connection) => {

        if (connectionError) {
            return res.status(500).json({
                message: "Could not get database connection",
                error: connectionError.message
            });
        }

        connection.beginTransaction((transactionError) => {

            if (transactionError) {
                connection.release();

                return res.status(500).json({
                    message: "Could not start booking",
                    error: transactionError.message
                });
            }

            /* CHECK SLOT */

            const slotSql = `
                SELECT *
                FROM slots
                WHERE id = ?
                FOR UPDATE
            `;

            connection.query(
                slotSql,
                [slot_id],
                (err, slotResults) => {

                    if (err) {
                        return connection.rollback(() => {
                            connection.release();

                            res.status(500).json({
                                message: "Failed to check slot",
                                error: err.message
                            });
                        });
                    }

                    if (slotResults.length === 0) {
                        return connection.rollback(() => {
                            connection.release();

                            res.status(404).json({
                                message: "Slot not found"
                            });
                        });
                    }

                    const slot = slotResults[0];

                    if (
                        Number(slot.centre_id) !==
                        Number(centre_id)
                    ) {
                        return connection.rollback(() => {
                            connection.release();

                            res.status(400).json({
                                message:
                                    "Slot does not belong to selected centre"
                            });
                        });
                    }

                    if (
                        Number(slot.booked_count) >=
                        Number(slot.capacity)
                    ) {
                        return connection.rollback(() => {
                            connection.release();

                            res.status(400).json({
                                message: "Slot is full"
                            });
                        });
                    }

                    /* CHECK FARMER */

                    const farmerSql = `
                        SELECT id
                        FROM users
                        WHERE id = ?
                        LIMIT 1
                    `;

                    connection.query(
                        farmerSql,
                        [farmer_id],
                        (err, farmerResults) => {

                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();

                                    res.status(500).json({
                                        message:
                                            "Failed to check farmer",
                                        error: err.message
                                    });
                                });
                            }

                            if (farmerResults.length === 0) {
                                return connection.rollback(() => {
                                    connection.release();

                                    res.status(404).json({
                                        message: "Farmer not found"
                                    });
                                });
                            }

                            /* CHECK CROP BELONGS TO FARMER */

                            const cropSql = `
                                SELECT
                                    id,
                                    crop_name,
                                    crop_variety,
                                    quantity,
                                    unit
                                FROM crops
                                WHERE id = ?
                                AND farmer_id = ?
                                LIMIT 1
                            `;

                            connection.query(
                                cropSql,
                                [crop_id, farmer_id],
                                (err, cropResults) => {

                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();

                                            res.status(500).json({
                                                message:
                                                    "Failed to check crop",
                                                error: err.message
                                            });
                                        });
                                    }

                                    if (cropResults.length === 0) {
                                        return connection.rollback(() => {
                                            connection.release();

                                            res.status(404).json({
                                                message:
                                                    "Selected crop was not found for this farmer"
                                            });
                                        });
                                    }

                                    const crop = cropResults[0];

                                    /* CHECK AVAILABLE QUANTITY */

                                    if (
                                        bookingQuantity >
                                        Number(crop.quantity)
                                    ) {
                                        return connection.rollback(() => {
                                            connection.release();

                                            res.status(400).json({
                                                message:
                                                    `Booking quantity cannot exceed available quantity of ${crop.quantity} ${crop.unit || "kg"}`
                                            });
                                        });
                                    }

                                    /* CHECK ACTIVE BOOKING */

                                    const duplicateSql = `
                                        SELECT id
                                        FROM bookings
                                        WHERE farmer_id = ?
                                        AND status = 'waiting'
                                        LIMIT 1
                                    `;

                                    connection.query(
                                        duplicateSql,
                                        [farmer_id],
                                        (err, duplicateResults) => {

                                            if (err) {
                                                return connection.rollback(() => {
                                                    connection.release();

                                                    res.status(500).json({
                                                        message:
                                                            "Failed to check existing booking",
                                                        error: err.message
                                                    });
                                                });
                                            }

                                            if (
                                                duplicateResults.length > 0
                                            ) {
                                                return connection.rollback(() => {
                                                    connection.release();

                                                    res.status(400).json({
                                                        message:
                                                            "You already have an active booking"
                                                    });
                                                });
                                            }

                                            /* QUEUE POSITION */

                                            const positionSql = `
                                                SELECT COUNT(*) AS count
                                                FROM queue
                                                WHERE centre_id = ?
                                                AND status = 'waiting'
                                            `;

                                            connection.query(
                                                positionSql,
                                                [centre_id],
                                                (err, positionResults) => {

                                                    if (err) {
                                                        return connection.rollback(() => {
                                                            connection.release();

                                                            res.status(500).json({
                                                                message:
                                                                    "Failed to calculate queue",
                                                                error:
                                                                    err.message
                                                            });
                                                        });
                                                    }

                                                    const position =
                                                        Number(
                                                            positionResults[0]
                                                                .count
                                                        ) + 1;

                                                    const estimatedWait =
                                                        (position - 1) * 15;

                                                    /* TOKEN PREFIX */

                                                    let prefix = "A";

                                                    if (
                                                        Number(centre_id) === 2
                                                    ) {
                                                        prefix = "B";
                                                    }

                                                    if (
                                                        Number(centre_id) === 3
                                                    ) {
                                                        prefix = "C";
                                                    }

                                                    /* GENERATE TOKEN */

                                                    const tokenSql = `
                                                        SELECT token_number
                                                        FROM bookings
                                                        WHERE centre_id = ?
                                                    `;

                                                    connection.query(
                                                        tokenSql,
                                                        [centre_id],
                                                        (err, tokenResults) => {

                                                            if (err) {
                                                                return connection.rollback(() => {
                                                                    connection.release();

                                                                    res.status(500).json({
                                                                        message:
                                                                            "Failed to generate token",
                                                                        error:
                                                                            err.message
                                                                    });
                                                                });
                                                            }

                                                            let highestNumber = 0;

                                                            tokenResults.forEach(
                                                                (row) => {

                                                                    const token =
                                                                        row.token_number ||
                                                                        "";

                                                                    if (
                                                                        token.startsWith(
                                                                            prefix
                                                                        )
                                                                    ) {

                                                                        const number =
                                                                            parseInt(
                                                                                token.substring(
                                                                                    prefix.length
                                                                                ),
                                                                                10
                                                                            );

                                                                        if (
                                                                            !isNaN(
                                                                                number
                                                                            ) &&
                                                                            number >
                                                                                highestNumber
                                                                        ) {
                                                                            highestNumber =
                                                                                number;
                                                                        }
                                                                    }
                                                                }
                                                            );

                                                            const tokenNumber =
                                                                prefix +
                                                                String(
                                                                    highestNumber +
                                                                        1
                                                                ).padStart(
                                                                    3,
                                                                    "0"
                                                                );

                                                            /* INSERT BOOKING */

                                                            const bookingSql = `
                                                                INSERT INTO bookings
                                                                (
                                                                    farmer_id,
                                                                    crop_id,
                                                                    crop_variety,
                                                                    quantity,
                                                                    centre_id,
                                                                    slot_id,
                                                                    token_number,
                                                                    status
                                                                )
                                                                VALUES
                                                                (?, ?, ?, ?, ?, ?, ?, 'waiting')
                                                            `;

                                                            connection.query(
                                                                bookingSql,
                                                                [
                                                                    farmer_id,
                                                                    crop_id,
                                                                    crop_variety,
                                                                    bookingQuantity,
                                                                    centre_id,
                                                                    slot_id,
                                                                    tokenNumber
                                                                ],
                                                                (
                                                                    err,
                                                                    bookingResult
                                                                ) => {

                                                                    if (err) {
                                                                        return connection.rollback(() => {
                                                                            connection.release();

                                                                            res.status(500).json({
                                                                                message:
                                                                                    "Booking failed",
                                                                                error:
                                                                                    err.message
                                                                            });
                                                                        });
                                                                    }

                                                                    const bookingId =
                                                                        bookingResult.insertId;

                                                                    /* INSERT QUEUE */

                                                                    const queueSql = `
                                                                        INSERT INTO queue
                                                                        (
                                                                            booking_id,
                                                                            farmer_id,
                                                                            centre_id,
                                                                            token_number,
                                                                            position,
                                                                            status,
                                                                            estimated_wait
                                                                        )
                                                                        VALUES
                                                                        (?, ?, ?, ?, ?, 'waiting', ?)
                                                                    `;

                                                                    connection.query(
                                                                        queueSql,
                                                                        [
                                                                            bookingId,
                                                                            farmer_id,
                                                                            centre_id,
                                                                            tokenNumber,
                                                                            position,
                                                                            estimatedWait
                                                                        ],
                                                                        (err) => {

                                                                            if (err) {
                                                                                return connection.rollback(() => {
                                                                                    connection.release();

                                                                                    res.status(500).json({
                                                                                        message:
                                                                                            "Failed to add farmer to queue",
                                                                                        error:
                                                                                            err.message
                                                                                    });
                                                                                });
                                                                            }

                                                                            /* UPDATE SLOT */

                                                                            const updateSlotSql = `
                                                                                UPDATE slots
                                                                                SET booked_count =
                                                                                    booked_count + 1
                                                                                WHERE id = ?
                                                                            `;

                                                                            connection.query(
                                                                                updateSlotSql,
                                                                                [slot_id],
                                                                                (err) => {

                                                                                    if (err) {
                                                                                        return connection.rollback(() => {
                                                                                            connection.release();

                                                                                            res.status(500).json({
                                                                                                message:
                                                                                                    "Failed to update slot",
                                                                                                error:
                                                                                                    err.message
                                                                                            });
                                                                                        });
                                                                                    }

                                                                                    /* COMMIT */

                                                                                    connection.commit(
                                                                                        (
                                                                                            commitError
                                                                                        ) => {

                                                                                            if (
                                                                                                commitError
                                                                                            ) {
                                                                                                return connection.rollback(() => {
                                                                                                    connection.release();

                                                                                                    res.status(500).json({
                                                                                                        message:
                                                                                                            "Booking commit failed",
                                                                                                        error:
                                                                                                            commitError.message
                                                                                                    });
                                                                                                });
                                                                                            }

                                                                                            connection.release();

                                                                                            res.status(
                                                                                                201
                                                                                            ).json({
                                                                                                message:
                                                                                                    "Slot booked successfully ✅",

                                                                                                booking_id:
                                                                                                    bookingId,

                                                                                                token_number:
                                                                                                    tokenNumber,

                                                                                                position:
                                                                                                    position,

                                                                                                estimated_wait:
                                                                                                    estimatedWait,

                                                                                                quantity:
                                                                                                    bookingQuantity,

                                                                                                unit:
                                                                                                    crop.unit ||
                                                                                                    "kg"
                                                                                            });
                                                                                        }
                                                                                    );
                                                                                }
                                                                            );
                                                                        }
                                                                    );
                                                                }
                                                            );
                                                        }
                                                    );
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    });
});
/* =====================================================
   FARMER QUEUE
===================================================== */

app.get("/api/queue/:farmer_id", (req, res) => {
    const farmerId = req.params.farmer_id;

    const sql = `
        SELECT
            q.token_number,
            q.position,

            (
                SELECT COUNT(*)
                FROM queue q2
                WHERE q2.centre_id = q.centre_id
                AND q2.position < q.position
                AND q2.status = 'waiting'
            ) AS farmers_ahead,

            q.estimated_wait,
            q.status,

            c.name AS centre_name,

            s.slot_date,
            s.start_time,
            s.end_time,

            b.quantity AS booking_quantity,
            cr.crop_name,
            b.crop_variety,
            cr.unit

        FROM queue q

        JOIN bookings b
            ON q.booking_id = b.id

        JOIN centres c
            ON q.centre_id = c.id

        JOIN slots s
            ON b.slot_id = s.id

        LEFT JOIN crops cr
            ON b.crop_id = cr.id

        WHERE q.farmer_id = ?
        AND q.status = 'waiting'

        ORDER BY q.id DESC
        LIMIT 1
    `;

    db.query(sql, [farmerId], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to load queue",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "No active queue"
            });
        }

        res.json(results[0]);
    });
});

/* =====================================================
   STAFF QUEUE
===================================================== */

app.get("/api/staff/queue/:centre_id", (req, res) => {
    const centreId = req.params.centre_id;

    const sql = `
        SELECT
            q.id,
            q.booking_id,
            q.farmer_id,
            q.token_number,
            q.position,
            q.status,
            q.estimated_wait,

            u.name AS farmer_name,
            u.mobile,

            c.name AS centre_name,

            b.crop_variety,
            b.quantity AS booking_quantity,

            cr.id AS crop_id,
            cr.crop_name,
            cr.quantity AS crop_quantity,
            cr.unit AS crop_unit

        FROM queue q

        JOIN users u
            ON q.farmer_id = u.id

        JOIN centres c
            ON q.centre_id = c.id

        JOIN bookings b
            ON q.booking_id = b.id

        LEFT JOIN crops cr
            ON cr.id = b.crop_id

        WHERE q.centre_id = ?
        AND q.status = 'waiting'

        ORDER BY q.position ASC
    `;

    db.query(sql, [centreId], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to load staff queue",
                error: err.message
            });
        }

        res.json(results);
    });
});

/* =====================================================
   PROCUREMENT
===================================================== */

app.post("/api/procurement", (req, res) => {
    const {
        booking_id,
        farmer_id,
        crop_id,
        quantity,
        rate
    } = req.body;

    if (
        !booking_id ||
        !farmer_id ||
        !crop_id ||
        quantity === undefined ||
        quantity === null ||
        rate === undefined ||
        rate === null
    ) {
        return res.status(400).json({
            message:
                "Booking, farmer, crop, quantity and rate are required"
        });
    }

    const numericQuantity = Number(quantity);
    const numericRate = Number(rate);

    if (
        !Number.isFinite(numericQuantity) ||
        numericQuantity <= 0 ||
        !Number.isFinite(numericRate) ||
        numericRate <= 0
    ) {
        return res.status(400).json({
            message:
                "Quantity and rate must be greater than zero"
        });
    }

    const bookingSql = `
        SELECT
            b.*,
            c.crop_name,
            c.crop_variety,
            c.quantity AS available_quantity,
            c.unit
        FROM bookings b
        LEFT JOIN crops c
            ON b.crop_id = c.id
        WHERE b.id = ?
        AND b.farmer_id = ?
        LIMIT 1
    `;

    db.query(
        bookingSql,
        [booking_id, farmer_id],
        (err, bookingResults) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to check booking",
                    error: err.message
                });
            }

            if (bookingResults.length === 0) {
                return res.status(404).json({
                    message: "Booking not found"
                });
            }

            const booking = bookingResults[0];

            if (
                Number(booking.crop_id) !==
                Number(crop_id)
            ) {
                return res.status(400).json({
                    message:
                        "Selected crop does not match booking"
                });
            }

            if (
                booking.quantity !== null &&
                Number(booking.quantity) > 0 &&
                numericQuantity >
                    Number(booking.quantity)
            ) {
                return res.status(400).json({
                    message:
                        "Procurement quantity cannot exceed booked quantity"
                });
            }

            const totalAmount =
                numericQuantity * numericRate;

            const insertSql = `
                INSERT INTO procurement
                (
                    booking_id,
                    farmer_id,
                    crop_id,
                    quantity,
                    rate,
                    total_amount,
                    status
                )
                VALUES
                (?, ?, ?, ?, ?, ?, 'completed')
            `;

            db.query(
                insertSql,
                [
                    booking_id,
                    farmer_id,
                    crop_id,
                    numericQuantity,
                    numericRate,
                    totalAmount
                ],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            message:
                                "Procurement failed",
                            error: err.message
                        });
                    }

                    const updateBookingSql = `
                        UPDATE bookings
                        SET status = 'completed'
                        WHERE id = ?
                    `;

                    db.query(
                        updateBookingSql,
                        [booking_id],
                        (err) => {
                            if (err) {
                                return res.status(500).json({
                                    message:
                                        "Procurement saved but booking update failed",
                                    error: err.message
                                });
                            }

                            const updateQueueSql = `
                                UPDATE queue
                                SET status = 'completed'
                                WHERE booking_id = ?
                            `;

                            db.query(
                                updateQueueSql,
                                [booking_id],
                                (err) => {
                                    if (err) {
                                        return res.status(500).json({
                                            message:
                                                "Procurement saved but queue update failed",
                                            error: err.message
                                        });
                                    }

                                    res.status(201).json({
                                        message:
                                            "Procurement completed successfully ✅",
                                        procurement_id:
                                            result.insertId,
                                        total_amount:
                                            totalAmount,
                                        quantity:
                                            numericQuantity,
                                        rate:
                                            numericRate
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

/* =====================================================
   PAYMENT
===================================================== */

app.post("/api/payments", (req, res) => {
    const {
        booking_id,
        farmer_id,
        amount,
        payment_method,
        transaction_id
    } = req.body;

    if (
        !booking_id ||
        !farmer_id ||
        amount === undefined ||
        amount === null
    ) {
        return res.status(400).json({
            message:
                "Booking, farmer and amount are required"
        });
    }

    const numericAmount = Number(amount);

    if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {
        return res.status(400).json({
            message: "Invalid payment amount"
        });
    }

    const procurementSql = `
        SELECT *
        FROM procurement
        WHERE booking_id = ?
        AND farmer_id = ?
        AND status = 'completed'
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(
        procurementSql,
        [booking_id, farmer_id],
        (err, procurementResults) => {
            if (err) {
                return res.status(500).json({
                    message:
                        "Failed to check procurement",
                    error: err.message
                });
            }

            if (procurementResults.length === 0) {
                return res.status(400).json({
                    message:
                        "Procurement must be completed before payment"
                });
            }

            const procurement =
                procurementResults[0];

            if (
                Math.abs(
                    numericAmount -
                        Number(procurement.total_amount)
                ) > 0.01
            ) {
                return res.status(400).json({
                    message:
                        "Payment amount does not match procurement amount"
                });
            }

            const duplicateSql = `
                SELECT id
                FROM payments
                WHERE booking_id = ?
                AND status = 'completed'
                LIMIT 1
            `;

            db.query(
                duplicateSql,
                [booking_id],
                (err, duplicateResults) => {
                    if (err) {
                        return res.status(500).json({
                            message:
                                "Failed to check payment",
                            error: err.message
                        });
                    }

                    if (
                        duplicateResults.length > 0
                    ) {
                        return res.status(400).json({
                            message:
                                "Payment already completed"
                        });
                    }

                    const paymentSql = `
                        INSERT INTO payments
                        (
                            booking_id,
                            farmer_id,
                            amount,
                            payment_method,
                            transaction_id,
                            status,
                            paid_at
                        )
                        VALUES
                        (?, ?, ?, ?, ?, 'completed', NOW())
                    `;

                    db.query(
                        paymentSql,
                        [
                            booking_id,
                            farmer_id,
                            numericAmount,
                            payment_method ||
                                "Bank Transfer",
                            transaction_id ||
                                null
                        ],
                        (err, result) => {
                            if (err) {
                                return res.status(500).json({
                                    message:
                                        "Payment failed",
                                    error: err.message
                                });
                            }

                            res.status(201).json({
                                message:
                                    "Payment completed successfully ✅",
                                payment_id:
                                    result.insertId,
                                amount:
                                    numericAmount
                            });
                        }
                    );
                }
            );
        }
    );
});

/* =====================================================
   FARMER STATUS
===================================================== */

app.get("/api/status/:farmer_id", (req, res) => {
    const farmerId = req.params.farmer_id;

    const sql = `
        SELECT
            b.id AS booking_id,
            b.token_number,
            b.status AS booking_status,

            c.name AS centre_name,

            s.slot_date,
            s.start_time,
            s.end_time,

            cr.crop_name,
            b.crop_variety,
            b.quantity AS booking_quantity,
            cr.unit,

            p.quantity,
            p.rate,
            p.total_amount,
            p.status AS procurement_status,

            pay.amount AS payment_amount,
            pay.payment_method,
            pay.transaction_id,
            pay.status AS payment_status,
            pay.paid_at

        FROM bookings b

        JOIN centres c
            ON b.centre_id = c.id

        JOIN slots s
            ON b.slot_id = s.id

        LEFT JOIN procurement p
            ON b.id = p.booking_id

        LEFT JOIN crops cr
            ON p.crop_id = cr.id

        LEFT JOIN payments pay
            ON b.id = pay.booking_id

        WHERE b.farmer_id = ?

        ORDER BY b.id DESC
        LIMIT 1
    `;

    db.query(sql, [farmerId], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to load status",
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "No booking found"
            });
        }

        res.json(results[0]);
    });
});

/* =====================================================
   STAFF ANALYTICS
===================================================== */

app.get("/api/staff/analytics/:centre_id", (req, res) => {
    const centreId = req.params.centre_id;

    const sql = `
        SELECT

            (
                SELECT COUNT(*)
                FROM queue q
                WHERE q.centre_id = ?
                AND q.status = 'waiting'
            ) AS waiting_farmers,

            (
                SELECT COUNT(DISTINCT p.farmer_id)
                FROM procurement p
                JOIN bookings b
                    ON p.booking_id = b.id
                WHERE b.centre_id = ?
                AND p.status = 'completed'
                AND DATE(p.procurement_date) = CURDATE()
            ) AS todays_farmers,

            (
                SELECT COALESCE(SUM(p.quantity), 0)
                FROM procurement p
                JOIN bookings b
                    ON p.booking_id = b.id
                WHERE b.centre_id = ?
                AND p.status = 'completed'
                AND DATE(p.procurement_date) = CURDATE()
            ) AS total_quantity_procured,

            (
                SELECT COUNT(*)
                FROM procurement p
                JOIN bookings b
                    ON p.booking_id = b.id
                WHERE b.centre_id = ?
                AND p.status = 'completed'
                AND DATE(p.procurement_date) = CURDATE()
            ) AS completed_procurements,

            (
                SELECT COALESCE(SUM(pay.amount), 0)
                FROM payments pay
                JOIN bookings b
                    ON pay.booking_id = b.id
                WHERE b.centre_id = ?
                AND pay.status = 'completed'
                AND DATE(pay.paid_at) = CURDATE()
            ) AS total_amount_paid
    `;

    db.query(
        sql,
        [
            centreId,
            centreId,
            centreId,
            centreId,
            centreId
        ],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    message:
                        "Failed to load dashboard analytics",
                    error: err.message
                });
            }

            const data = results[0];

            res.json({
                waiting_farmers:
                    Number(data.waiting_farmers || 0),

                todays_farmers:
                    Number(data.todays_farmers || 0),

                total_quantity_procured:
                    Number(
                        data.total_quantity_procured || 0
                    ),

                completed_procurements:
                    Number(
                        data.completed_procurements || 0
                    ),

                total_amount_paid:
                    Number(
                        data.total_amount_paid || 0
                    )
            });
        }
    );
});

/* =====================================================
   ERROR HANDLER
===================================================== */

app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err);

    res.status(500).json({
        message: "Internal server error",
        error: err.message
    });
});

/* =====================================================
   START SERVER
===================================================== */

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Kisan Setu Backend running on port ${PORT} 🚀`
    );
});
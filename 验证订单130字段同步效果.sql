-- 验证订单130字段同步效果

-- 1. 查看原始订单数据（作为对比基准）
SELECT 
    booking_id, order_number, contact_person, contact_phone,
    adult_count, child_count, total_price, 
    hotel_room_count, room_details, hotel_level, room_type,
    hotel_check_in_date, hotel_check_out_date,
    flight_number, return_flight_number, 
    arrival_landing_time, departure_departure_time, departure_landing_time,
    service_type, payment_status, agent_id, group_size, status,
    passenger_contact, special_requests
FROM tour_bookings 
WHERE booking_id = 130;

-- 2. 查看排团表中同步后的数据
SELECT 
    id, booking_id, tour_date, order_number, 
    contact_person, contact_phone,
    adult_count, child_count, total_price,
    hotel_room_count, room_details, hotel_level, room_type,
    hotel_check_in_date, hotel_check_out_date,
    flight_number, return_flight_number,
    arrival_landing_time, departure_departure_time, departure_landing_time,
    service_type, payment_status, agent_id, group_size, status,
    passenger_contact, special_requests,
    title, description
FROM tour_schedule_order 
WHERE booking_id = 130
ORDER BY tour_date;

-- 3. 统计字段完整性（检查关键字段）
SELECT 
    booking_id,
    '字段完整性检查' as check_type,
    CASE WHEN contact_person IS NOT NULL AND contact_person != '' THEN 'OK' ELSE 'MISSING' END as contact_person_status,
    CASE WHEN contact_phone IS NOT NULL AND contact_phone != '' THEN 'OK' ELSE 'MISSING' END as contact_phone_status,
    CASE WHEN flight_number IS NOT NULL AND flight_number != '' THEN 'OK' ELSE 'MISSING' END as flight_number_status,
    CASE WHEN return_flight_number IS NOT NULL AND return_flight_number != '' THEN 'OK' ELSE 'MISSING' END as return_flight_status,
    CASE WHEN hotel_room_count IS NOT NULL AND hotel_room_count > 0 THEN 'OK' ELSE 'MISSING' END as hotel_room_count_status,
    CASE WHEN room_details IS NOT NULL AND room_details != '' THEN 'OK' ELSE 'MISSING' END as room_details_status,
    CASE WHEN hotel_check_in_date IS NOT NULL THEN 'OK' ELSE 'MISSING' END as check_in_date_status,
    CASE WHEN hotel_check_out_date IS NOT NULL THEN 'OK' ELSE 'MISSING' END as check_out_date_status,
    CASE WHEN total_price IS NOT NULL AND total_price > 0 THEN 'OK' ELSE 'MISSING' END as total_price_status,
    CASE WHEN passenger_contact IS NOT NULL AND passenger_contact != '' THEN 'OK' ELSE 'MISSING' END as passenger_contact_status
FROM tour_schedule_order 
WHERE booking_id = 130;

-- 4. 详细对比源数据和同步后数据
SELECT 
    '原始订单数据' as data_source,
    tb.booking_id,
    tb.contact_person,
    tb.contact_phone,
    tb.flight_number,
    tb.return_flight_number,
    tb.hotel_room_count,
    tb.room_details,
    tb.hotel_check_in_date,
    tb.hotel_check_out_date,
    tb.total_price,
    tb.passenger_contact
FROM tour_bookings tb
WHERE tb.booking_id = 130

UNION ALL

SELECT 
    CONCAT('排团数据-', tour_date) as data_source,
    tso.booking_id,
    tso.contact_person,
    tso.contact_phone,
    tso.flight_number,
    tso.return_flight_number,
    tso.hotel_room_count,
    tso.room_details,
    tso.hotel_check_in_date,
    tso.hotel_check_out_date,
    tso.total_price,
    tso.passenger_contact
FROM tour_schedule_order tso
WHERE tso.booking_id = 130
ORDER BY data_source; 
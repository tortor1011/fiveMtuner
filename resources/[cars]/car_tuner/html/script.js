/**
 * car_tuner/html/script.js
 * ═══════════════════════════════════════════════════════════════════════════
 * Vehicle Handling Editor — NUI front-end with Complete Thai Localization & Tooltips.
 *
 * This file:
 *  1. Provides HANDLING_DICTIONARY: Complete Thai labels, descriptions, and up/down tuning tooltips.
 *  2. Defines every CHandlingData field with metadata (type, range, step).
 *  3. Dynamically generates the tabbed 2-column UI with tooltips from those definitions.
 *  4. Bridges slider / input changes to Lua via NUI fetch.
 *  5. Exports all current values as a complete handling.meta XML snippet.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    //  HANDLING DICTIONARY (THAI LOCALIZATION & TUNING GUIDES)
    // ─────────────────────────────────────────────────────────────────────────

    const HANDLING_DICTIONARY = {
        // 1. หมวดเครื่องยนต์ & เกียร์ (Engine & Transmission)
        fInitialDriveForce: {
            label: "แรงขับเคลื่อน / อัตราเร่ง",
            desc: "กำหนดกำลังเครื่องยนต์และอัตราเร่งตอนกดคันเร่ง",
            up: "ออกตัวแรง ดึงหนัก เร่งแซงไว (ถ้ามากไปล้อจะฟรีทิ้ง)",
            down: "อัตราเร่งหนืด รถอืด ออกตัวนิ่มนวล"
        },
        fDriveBiasFront: {
            label: "ระบบขับเคลื่อน (หน้า/หลัง)",
            desc: "สัดส่วนการกระจายกำลังลงล้อหน้าและล้อหลัง",
            up: "1.0 = ขับหน้า (FWD) เลี้ยวหน้าดื้อ | 0.5 = ขับสี่ (AWD) ออกตัวนิ่ง | 0.0 = ขับหลัง (RWD) ท้ายปัด ดริฟต์ง่าย",
            down: "ปรับลงล้อหลังมากขึ้น"
        },
        nInitialDriveGears: {
            label: "จำนวนเกียร์เดินหน้า",
            desc: "จำนวนเกียร์สูงสุดของรถ (ปกติ 1-8)",
            up: "เกียร์ชิดขึ้น ไล่รอบได้หลายช่วง",
            down: "เกียร์ยาว ลากรอบนาน (ถ้าตั้ง 1 จะเป็นเกียร์เดียวแบบรถไฟฟ้า)"
        },
        fDriveInertia: {
            label: "อัตราตอบสนองคันเร่ง / รอบเครื่อง",
            desc: "ความไวในการกวาดรอบของเครื่องยนต์และการเปลี่ยนเกียร์",
            up: "รอบฟาดไว ตอบสนองคันเร่งติดเท้า",
            down: "รอบกวาดช้า คันเร่งหน่วง นุ่มนวล"
        },
        fClutchChangeRateScaleUpShift: {
            label: "ความเร็วตัดต่อคลัตช์ (เข้าเกียร์ขึ้น)",
            desc: "ความเร็วในการเปลี่ยนเกียร์ขึ้นสู่เกียร์ถัดไป",
            up: "สับเกียร์ไวต่อเนื่อง รอบไม่ตก ความเร็วไม่สะดุด",
            down: "สับเกียร์ช้า รอบห้อยจังหวะเปลี่ยนเกียร์"
        },
        fClutchChangeRateScaleDownShift: {
            label: "ความเร็วตัดต่อคลัตช์ (เชนจ์เกียร์ลง)",
            desc: "ความเร็วในการลดเกียร์เวลาเบรกหรือชะลอรถ",
            up: "เชนจ์เกียร์ลงเร็ว ช่วยสร้าง Engine Brake ทันใจ",
            down: "เชนจ์เกียร์ลงช้า รอจังหวะรอบลงนาน"
        },
        fInitialDriveMaxFlatVel: {
            label: "ความเร็วสูงสุดบนทางราบ (Top Speed Engine)",
            desc: "ความเร็วปลายสูงสุดที่กำลังเครื่องยนต์สามารถดันไปถึงได้ (หน่วย mph/ระบบฟิสิกส์)",
            up: "ความเร็วปลายไหลได้ลึกขึ้น",
            down: "ความเร็วตันเร็ว อั้นที่รอบปลาย"
        },

        // 2. หมวดเบรก & การเลี้ยว (Brakes & Steering)
        fBrakeForce: {
            label: "แรงเบรกหลัก",
            desc: "พลังในการหยุดล้อเมื่อเหยียบเบรก",
            up: "ระยะเบรกสั้นลง หยุดรถทันใจ (ถ้าเยอะไปล้อจะล็อกไถล)",
            down: "ระยะเบรกยาวขึ้น ต้องเบรกล่วงหน้า"
        },
        fBrakeBiasFront: {
            label: "สัดส่วนกระจายแรงเบรก (หน้า/หลัง)",
            desc: "ความสมดุลของการเบรกระหว่างล้อหน้ากับล้อหลัง",
            up: "> 0.5 เบรกล้อหน้าจับมากกว่า ท้ายไม่ออกแต่เลี้ยวไม่เข้าตอนเบรก",
            down: "< 0.5 เบรกล้อหลังจับมากกว่า ท้ายจะปัดเวลาเบรกหนัก"
        },
        fHandBrakeForce: {
            label: "แรงดึงเบรกมือ",
            desc: "กำลังล็อกของเบรกมือสำหรับสไลด์หรือดริฟต์",
            up: "ดึงปุ๊บล้อหลังล็อกตายทันที ดริฟต์ง่าย กลับลำไว",
            down: "ดึงแล้วล้อไม่ค่อยล็อก ชะลอตัวช้า"
        },
        fSteeringLock: {
            label: "องศาการเลี้ยวสูงสุด",
            desc: "มุมเลี้ยวของล้อหน้าเมื่อหักพวงมาลัยสุด (องศา)",
            up: "วงเลี้ยวแคบ เลี้ยวโค้งหักศอกง่าย แก้ดริฟต์ได้มุมกว้าง",
            down: "วงเลี้ยวกว้าง เลี้ยวทื่อ เข้าโค้งแคบยาก"
        },

        // 3. หมวดการยึดเกาะถนน & ยาง (Traction & Grip)
        fTractionCurveMax: {
            label: "การยึดเกาะถนนสูงสุด (Grip ปกติ)",
            desc: "ความหนึบของยางขณะเข้าโค้งในสภาวะปกติ",
            up: "เกาะถนนหนึบ เข้าโค้งได้เร็วมาก ไม่หลุดไลน์",
            down: "ลื่นง่าย รถจะไถลแถออกนอกโค้ง"
        },
        fTractionCurveMin: {
            label: "การยึดเกาะขณะลื่นไถล (Sliding Grip)",
            desc: "การเกาะถนนเมื่อรถเริ่มเสียการทรงตัวหรือกำลังดริฟต์",
            up: "ลื่นแล้วดึงกลับมาเกาะเร็ว รถดริฟต์ยาก คุมอาการง่าย",
            down: "สไลด์เนียน ท้ายกวาดได้ยาวต่อเนื่อง เหมาะกับรถดริฟต์"
        },
        fTractionCurveLateral: {
            label: "ระยะจุดเลี้ยวคม / แรงเกาะด้านข้าง",
            desc: "มุมองศาที่ยางจะเริ่มสูญเสียแรงยึดเกาะด้านข้าง",
            up: "เลี้ยวคม ตอบสนองไว เปลี่ยนเลนกะทันหันนิ่ง",
            down: "เลี้ยวแล้วยางค่อยๆ ย้วย ไม่คม"
        },
        fTractionSpringDeltaMax: {
            label: "ระยะสปริงตัวของหน้ายาง",
            desc: "การดูดซับแรงดันของหน้ายางเมื่อเจอลอนคลื่นหรือขอบทาง",
            up: "ยางช่วยซับแรงกระแทกจากพื้นผิวถนนได้ดี",
            down: "ยางแข็ง สะเทือน กระเด้งตามรอยต่อถนน"
        },
        fLowSpeedTractionLossMult: {
            label: "การสูญเสียการเกาะถนนช่วงความเร็วต่ำ",
            desc: "ความลื่นของยางตอนออกตัวจากจุดหยุดนิ่ง (Burnout)",
            up: "ออกตัวล้อฟรีง่าย เหมาะกับรถเบิร์นยาง",
            down: "ออกตัวไม่ฟรี ยางจับถนนทันที ออกตัวพุ่ง"
        },
        fCamberStiffnesss: {
            label: "ความแข็งแรงแคมเบอร์ (Camber Grip)",
            desc: "การยึดเกาะเมื่อล้อเอียงตามมุมแคมเบอร์ขณะเลี้ยว",
            up: "เข้าโค้งแรงๆ หน้ายางยังคงแนบสนิทกับถนน",
            down: "หน้ายางเสียการสัมผัสเมื่อเข้าโค้งหนัก"
        },
        fTractionBiasFront: {
            label: "สัดส่วนแรงยึดเกาะ (หน้า/หลัง)",
            desc: "การบาลานซ์การเกาะถนนระหว่างล้อหน้ากับล้อหลัง",
            up: "> 0.5 ล้อหน้าเกาะกว่าล้อหลัง ท้ายจะไวและปัดง่าย (Oversteer)",
            down: "< 0.5 ล้อหลังเกาะกว่าล้อหน้า เลี้ยวไม่ค่อยเข้า (Understeer)"
        },
        fTractionLossMult: {
            label: "ตัวคูณความลื่นบนพื้นผิวพิเศษ",
            desc: "การเกาะถนนบนพื้นโคลน ฝนตก หญ้า หรือดินลูกรัง",
            up: "ลื่นมากเมื่อลงไปวิ่งบนดินหรือหญ้า",
            down: "ลุยดินลูกรังหรือหญ้าได้โดยไม่เสียการควบคุม"
        },

        // 4. หมวดช่วงล่าง & สปริง (Suspension)
        fSuspensionForce: {
            label: "ความแข็งของสปริงช่วงล่าง",
            desc: "ความตึงและความแข็งของสปริงโช้คอัพ",
            up: "ช่วงล่างแข็งแบบรถแข่ง ไม่โยนตัว ทรงตัวนิ่งที่ความเร็วสูง",
            down: "ช่วงล่างนุ่ม ยวบยาบ ซับแรงดีแต่วิ่งเร็วแล้วโคลง"
        },
        fSuspensionCompDamp: {
            label: "ความหนืดจังหวะยุบตัว (Compression)",
            desc: "ความหน่วงของโช้คอัพตอนกระแทกยุบลง",
            up: "ยุบตัวช้า ไม่กระแทกติดซุ้มล้อ หนึบแน่น",
            down: "ยุบตัวเร็ว โช้คยุบยวบง่าย"
        },
        fSuspensionReboundDamp: {
            label: "ความหนืดจังหวะคืนตัว (Rebound)",
            desc: "ความเร็วที่สปริงดีดตัวกลับหลังยุบ",
            up: "คืนตัวช้า คุมอาการกระเด้งกระดอนได้นิ่ง",
            down: "คืนตัวเร็ว สปริงดีดรถลอย กระเด้งไม่หยุด"
        },
        fSuspensionUpperLimit: {
            label: "ระยะยืดสูงสุดของล้อ (Droop)",
            desc: "ระยะที่ล้อสามารถห้อยตัวลงมาได้เมื่อตัวถังลอย",
            up: "ล้อยืดลงได้ลึก เหมาะกับรถ Off-road ลุยหลุม",
            down: "ล้อยืดได้น้อย เหมาะกับรถโหลดเตี้ย"
        },
        fSuspensionLowerLimit: {
            label: "ระยะยุบสูงสุดของล้อ (Bump)",
            desc: "ระยะที่ล้อยุบเข้าไปในซุ้มล้อได้ (ค่ามักติดลบ)",
            up: "ล้อยุบได้ลึก ตัวรถไม่กระแทกพื้น",
            down: "ล้อยุบได้นิดเดียว ท้องรถเสี่ยงขูดพื้นถ้าโหลดเตี้ย"
        },
        fSuspensionRaise: {
            label: "ความสูงของช่วงล่าง (Ride Height)",
            desc: "ปรับระดับความสูง-ต่ำของตัวรถทั้งคัน",
            up: "ยกรถสูง โย่ง ลุยน้ำลุยเนินสะดวก",
            down: "โหลดเตี้ยติดพื้น ซุ้มล้อมิด หล่อสปอร์ต"
        },
        fSuspensionBiasFront: {
            label: "สัดส่วนความแข็งช่วงล่าง (หน้า/หลัง)",
            desc: "ความแข็งของช่วงล่างด้านหน้าเทียบกับด้านหลัง",
            up: "> 0.5 หน้ารถแข็งกว่าหลัง",
            down: "< 0.5 หน้ารถนิ่มกว่าหลัง"
        },

        // 5. หมวดกันโคลง & ความนิ่ง (Rollbars & Stability)
        fAntiRollBarForce: {
            label: "ความแข็งเหล็กกันโคลง (Anti-Roll Bar)",
            desc: "ป้องกันตัวถังรถเอียงไปด้านข้างตอนหักเลี้ยวแรงๆ",
            up: "ตัวถังแบนราบไปกับพื้น ไม่เอียง ทรงตัวดีมากในโค้ง",
            down: "ตัวถังเอียงยวบตามแรงเหวี่ยง เสี่ยงต่อการคว่ำ"
        },
        fAntiRollBarBiasFront: {
            label: "สัดส่วนเหล็กกันโคลง (หน้า/หลัง)",
            desc: "กระจายการต้านการเอียงระหว่างล้อหน้ากับล้อหลัง",
            up: "หน้าเอียงน้อยกว่าหลัง ลดอาการท้ายปัด",
            down: "หลังเอียงน้อยกว่าหน้า ช่วยให้เลี้ยวเข้าโค้งไวขึ้น"
        },
        fRollCentreHeightFront: {
            label: "จุดศูนย์กลางการเอียงล้อหน้า",
            desc: "แกนหมุนตามแนวขวางด้านหน้าตัวรถ",
            up: "หน้ารถต้านทานการเอียงได้สูงขึ้น",
            down: "หน้ารถยุบเอียงตามแรงเหวี่ยงง่ายขึ้น"
        },
        fRollCentreHeightRear: {
            label: "จุดศูนย์กลางการเอียงล้อหลัง",
            desc: "แกนหมุนตามแนวขวางด้านหลังตัวรถ",
            up: "ท้ายรถต้านทานการเอียงได้สูงขึ้น",
            down: "ท้ายรถยุบเอียงตามแรงเหวี่ยงง่ายขึ้น"
        },

        // 6. หมวดมวล น้ำหนัก & จุดศูนย์ถ่วง (Mass & Centre of Mass)
        fMass: {
            label: "น้ำหนักตัวรถ (กิโลกรัม)",
            desc: "มวลรวมของตัวถังและเครื่องยนต์",
            up: "รถหนัก ชนคันอื่นกระเด็น ทรงตัวต้านลมดี แต่อืดและเบรกยาวยิ่งขึ้น",
            down: "รถเบา พลิ้ว คล่องตัว แต่อาจปลิวง่ายเมื่อโดนชน"
        },
        fInitialDragCoeff: {
            label: "แรงต้านอากาศ (Aerodynamic Drag)",
            desc: "สัมประสิทธิ์แรงเสียดทานของอากาศเมื่อรถวิ่งเร็ว",
            up: "ต้านลมมาก ความเร็วปลายขึ้นช้า ลู่ลมน้อย",
            down: "ลู่ลม แหวกอากาศดี ความเร็วปลายไหลลื่น"
        },
        fPercentSubmerged: {
            label: "ระดับการจมน้ำก่อนเครื่องดับ (%)",
            desc: "เปอร์เซ็นต์ที่รถจมน้ำแล้วเครื่องยนต์จะหยุดทำงาน",
            up: "ลุยน้ำลึกได้มากขึ้นโดยที่เครื่องไม่ดับ",
            down: "เจอน้ำตื้นๆ เครื่องก็ดับทันที"
        },
        "vecCentreOfMassOffset.x": {
            label: "จุดศูนย์ถ่วงแกน X (ซ้าย / ขวา)",
            desc: "การกระจายน้ำหนักด้านข้าง (ปกติควรเป็น 0.0)",
            up: "> 0 น้ำหนักเอียงไปฝั่งขวา",
            down: "< 0 น้ำหนักเอียงไปฝั่งซ้าย"
        },
        "vecCentreOfMassOffset.y": {
            label: "จุดศูนย์ถ่วงแกน Y (หน้า / หลัง)",
            desc: "การกระจายน้ำหนักระหว่างหน้ารถกับท้ายรถ",
            up: "> 0 หน้ารถหนัก ออกตัวกดพื้นดี",
            down: "< 0 ท้ายรถหนัก ท้ายเหวี่ยงง่ายตอนเข้าโค้ง"
        },
        "vecCentreOfMassOffset.z": {
            label: "จุดศูนย์ถ่วงแกน Z (ความสูงจุด重心)",
            desc: "ระดับความสูงของจุดศูนย์ถ่วงตัวรถ (สำคัญที่สุดต่อการทรงตัว)",
            up: "จุดศูนย์ถ่วงสูง รถคว่ำง่ายมาก โคลงเคลง",
            down: "ค่าติดลบยิ่งมาก จุดศูนย์ถ่วงยิ่งต่ำ รถดูดพื้น เกาะหนึบ คว่ำยาก"
        },

        // 7. หมวดความเสียหาย & ความทนทาน (Damage Multipliers)
        fCollisionDamageMult: {
            label: "ตัวคูณความเสียหายจากการชน",
            desc: "อัตราความเสียหายของตัวรถเมื่อเกิดการชนปะทะ",
            up: "ชนแล้วพังยับเยิน ชิ้นส่วนหลุดง่าย",
            down: "รถถึก ชนแรงแค่ไหนก็แทบไม่พัง"
        },
        fWeaponDamageMult: {
            label: "ตัวคูณความเสียหายจากอาวุธ",
            desc: "อัตราความเสียหายเมื่อโดนกระสุนปืนหรือระเบิด",
            up: "โดนยิงไม่กี่นัดก็ควันขึ้นหรือระเบิด",
            down: "กันกระสุนได้ดี ทนต่อแรงระเบิด"
        },
        fDeformationDamageMult: {
            label: "ตัวคูณการยุบตัวของตัวถัง",
            desc: "ความบิดเบี้ยว ยุบ บุบ ของโครงสร้างรถเมื่อชน",
            up: "ตัวถังยุบและเบี้ยวเป็นเศษเหล็กได้ง่าย",
            down: "โครงเหล็กแข็งแกร่ง ชนแล้วตัวถังแทบไม่ยุบ"
        },
        fEngineDamageMult: {
            label: "ตัวคูณความเสียหายเครื่องยนต์",
            desc: "ความไวที่เครื่องยนต์จะดับ น็อค หรือไฟลุกเมื่อชนด้านหน้า",
            up: "ชนหน้าเบาๆ เครื่องพัง ควันดำทันที",
            down: "เครื่องทนทาน ชนหนักยังสตาร์ทติดวิ่งต่อได้"
        },

        // 8. หมวดแรงเฉื่อยการหมุน (Inertia Multipliers)
        "vecInertiaMultiplier.x": {
            label: "แรงเฉื่อยการหมุนแกน X (Pitch / หน้าทิ่ม-หน้าเชิด)",
            desc: "ความต้านทานแรงหมุนตามแกนขวางเมื่อเบรกหรือเร่ง",
            up: "หน้าทิ่ม/หน้าเชิดช้าลง ตัวรถนิ่งต้านทานแรงกระดก",
            down: "หน้าทิ่มและเชิดตามแรงเบรก/เร่งได้ง่ายขึ้น"
        },
        "vecInertiaMultiplier.y": {
            label: "แรงเฉื่อยการหมุนแกน Y (Roll / การเอียงข้าง)",
            desc: "ความต้านทานแรงหมุนตามแนวยาวของตัวรถ",
            up: "รถต้านการโคลงเอียงไปข้างๆ ตัวรถตั้งตรงมากขึ้น",
            down: "รถเอียงตามแรงเหวี่ยงหนีศูนย์ง่ายขึ้น"
        },
        "vecInertiaMultiplier.z": {
            label: "แรงเฉื่อยการหมุนแกน Z (Yaw / การหมุนกลับลำ)",
            desc: "ความต้านทานการหมุนรอบตัวเองของรถเมื่อเลี้ยวหรือดริฟต์",
            up: "แก้อาการหมุนคว้างง่าย รถเหวี่ยงกลับลำช้าลง",
            down: "รถกลับลำและหมุนสะบัดไว ควงสว่านง่ายขึ้น"
        },

        // 9. หมวดของเหลว & เบาะนั่ง (Fluids & Seats)
        fPetrolTankVolume: {
            label: "ความจุถังน้ำมันเชื้อเพลิง (ลิตร)",
            desc: "ปริมาตรความจุของถังน้ำมันและระดับความเสี่ยงติดไฟ",
            up: "ถังน้ำมันใหญ่ จุน้ำมันได้เยอะ (หากรั่วจะไฟลุกนาน)",
            down: "ถังน้ำมันเล็ก น้ำหนักของเหลวน้อย"
        },
        fOilVolume: {
            label: "ปริมาตรน้ำมันเครื่อง (ลิตร)",
            desc: "ปริมาณน้ำมันหล่อลื่นเครื่องยนต์เพื่อป้องกันเครื่องโอเวอร์ฮีต",
            up: "เครื่องยนต์ทนความร้อนสูงและลดการสึกหรอได้ยาวนาน",
            down: "น้ำมันเครื่องแห้งไว เครื่องยนต์เสี่ยงพังเร็วขึ้น"
        },
        fSeatOffsetDistX: {
            label: "ตำแหน่งเบาะแกน X (ซ้าย / ขวา)",
            desc: "ปรับระยะตำแหน่งท่านั่งของคนขับและผู้โดยสารตามแนวขวาง",
            up: "ขยับเบาะนั่งไปทางขวา",
            down: "ขยับเบาะนั่งไปทางซ้าย"
        },
        fSeatOffsetDistY: {
            label: "ตำแหน่งเบาะแกน Y (หน้า / หลัง)",
            desc: "ปรับระยะตำแหน่งท่านั่งของคนขับและผู้โดยสารตามแนวยาว",
            up: "เลื่อนเบาะนั่งไปข้างหน้า",
            down: "เลื่อนเบาะนั่งไปข้างหลัง"
        },
        fSeatOffsetDistZ: {
            label: "ตำแหน่งเบาะแกน Z (สูง / ต่ำ)",
            desc: "ปรับระดับความสูง-ต่ำของเบาะนั่งภายในห้องโดยสาร",
            up: "ยกเบาะนั่งสูงขึ้น มุมมองหลังพวงมาลัยสูง",
            down: "กดเบาะนั่งต่ำลง สไตล์สปอร์ตติดพื้น"
        },

        // 10. หมวดข้อมูลเฉพาะ & แฟล็ก (Identifiers & Flags)
        handlingName: {
            label: "ชื่อ Handling ID ของรถ",
            desc: "รหัสอ้างอิงของไฟล์ handling ที่ใช้จับคู่กับ vehicles.meta",
            up: "ระบุชื่อตรงกับ model name หรือ handlingId ของตัวรถ",
            down: "หากปล่อยว่างหรือระบุผิด อาจส่งผลให้ handling ไม่โหลด"
        },
        AIHandling: {
            label: "รูปแบบการขับของ AI (NPC)",
            desc: "พฤติกรรมของบอท AI เมื่อขับขี่รถคันนี้ (เช่น AVERAGE, SPORTS_CAR)",
            up: "ใช้พฤติกรรมขับขี่ที่เร็วและดุดันขึ้นตามประเภทรถ",
            down: "ใช้พฤติกรรมขับขี่แบบมาตรฐานทั่วไป"
        },
        nMonetaryValue: {
            label: "มูลค่าทางการเงินของตัวรถ ($)",
            desc: "ราคาประเมินตัวรถในระบบ handling และประกันภัย",
            up: "มูลค่ารถสูงขึ้นในระบบ",
            down: "มูลค่ารถลดลง"
        },
        strModelFlags: {
            label: "Model Flags (รหัส Hex)",
            desc: "แฟล็กคุณลักษณะโครงสร้างตัวรถ (Hex เช่น 440010)",
            up: "กำหนดคุณสมบัติพิเศษเฉพาะรุ่น",
            down: "ค่ามาตรฐาน 0"
        },
        strHandlingFlags: {
            label: "Handling Flags (รหัส Hex)",
            desc: "แฟล็กการทำงานของระบบขับเคลื่อนและพวงมาลัย (Hex เช่น 20002)",
            up: "เปิดใช้งานลูกเล่น handling เพิ่มเติม",
            down: "ค่ามาตรฐาน 0"
        },
        strDamageFlags: {
            label: "Damage Flags (รหัส Hex)",
            desc: "แฟล็กพฤติกรรมการเสียหายของชิ้นส่วนตัวถัง (Hex)",
            up: "เปิดการทำงานระบบความเสียหายเฉพาะ",
            down: "ค่ามาตรฐาน 0"
        },

        // 11. หมวด CCarHandlingData (SubHandlingData)
        fBackEndPopUpCarImpulseMult: {
            label: "แรงเด้งท้ายเมื่อชนรถคันอื่น (Car Popup)",
            desc: "แรงดีดตัวของท้ายรถเมื่อปะทะกับรถคันอื่น (CCarHandlingData)",
            up: "ท้ายรถดีดกระเด้งแรงขึ้นเมื่อชนรถคันอื่น",
            down: "ท้ายรถไม่ค่อยดีด ซับแรงปะทะคงที่"
        },
        fBackEndPopUpBuildingImpulseMult: {
            label: "แรงเด้งท้ายเมื่อชนอาคาร (Building Popup)",
            desc: "แรงดีดตัวของท้ายรถเมื่อปะทะกับกำแพงหรือสิ่งปลูกสร้าง",
            up: "ท้ายรถกระดอนออกจากกำแพงแรงขึ้น",
            down: "ท้ายรถแนบติด ไม่เด้งกลับ"
        },
        fBackEndPopUpMaxDeltaSpeed: {
            label: "ความเร็วสูงสุดของการดีดตัวท้ายรถ",
            desc: "ขีดจำกัดความเร็วสูงสุดที่อนุญาตให้ท้ายรถดีดตัวขึ้น",
            up: "ท้ายรถดีดตัวได้รวดเร็วทันที",
            down: "จำกัดความเร็วการกระดอนของท้ายรถให้น้อยลง"
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  FIELD DEFINITIONS (ORGANIZED IN 7 TABS)
    // ─────────────────────────────────────────────────────────────────────────

    const TABS = [
        {
            id: 'engine',
            label: 'เครื่องยนต์ & เกียร์',
            fields: [
                { key: 'fDriveBiasFront',                 type: 'float', min: 0.0,  max: 1.0,   step: 0.01 },
                { key: 'nInitialDriveGears',              type: 'int',   min: 1,    max: 8,     step: 1    },
                { key: 'fInitialDriveForce',              type: 'float', min: 0.01, max: 2.0,   step: 0.01 },
                { key: 'fDriveInertia',                   type: 'float', min: 0.01, max: 3.0,   step: 0.01 },
                { key: 'fClutchChangeRateScaleUpShift',   type: 'float', min: 0.1,  max: 10.0,  step: 0.1  },
                { key: 'fClutchChangeRateScaleDownShift', type: 'float', min: 0.1,  max: 10.0,  step: 0.1  },
                { key: 'fInitialDriveMaxFlatVel',         type: 'float', min: 10.0, max: 500.0, step: 1.0  }
            ]
        },
        {
            id: 'brakes',
            label: 'เบรก & การเลี้ยว',
            fields: [
                { key: 'fBrakeForce',      type: 'float', min: 0.01, max: 3.0,  step: 0.01 },
                { key: 'fBrakeBiasFront',  type: 'float', min: 0.0,  max: 1.0,  step: 0.01 },
                { key: 'fHandBrakeForce',  type: 'float', min: 0.01, max: 5.0,  step: 0.01 },
                { key: 'fSteeringLock',    type: 'float', min: 10.0, max: 80.0, step: 0.5  }
            ]
        },
        {
            id: 'traction',
            label: 'การยึดเกาะ & ยาง',
            fields: [
                { key: 'fTractionCurveMax',           type: 'float', min: 0.5, max: 4.0, step: 0.01 },
                { key: 'fTractionCurveMin',           type: 'float', min: 0.5, max: 4.0, step: 0.01 },
                { key: 'fTractionCurveLateral',       type: 'float', min: 10.0, max: 30.0, step: 0.1 },
                { key: 'fTractionSpringDeltaMax',     type: 'float', min: 0.01, max: 1.0, step: 0.01 },
                { key: 'fLowSpeedTractionLossMult',   type: 'float', min: 0.0, max: 2.0, step: 0.01 },
                { key: 'fCamberStiffnesss',           type: 'float', min: -1.0, max: 1.0, step: 0.01 },
                { key: 'fTractionBiasFront',          type: 'float', min: 0.0, max: 1.0, step: 0.01 },
                { key: 'fTractionLossMult',           type: 'float', min: 0.0, max: 5.0, step: 0.01 }
            ]
        },
        {
            id: 'suspension',
            label: 'ช่วงล่าง & สปริง',
            fields: [
                { type: 'divider', label: 'สปริง & โช้คอัพ (Springs & Dampers)' },
                { key: 'fSuspensionForce',        type: 'float', min: 0.1,  max: 5.0, step: 0.01 },
                { key: 'fSuspensionCompDamp',     type: 'float', min: 0.1,  max: 5.0, step: 0.01 },
                { key: 'fSuspensionReboundDamp',  type: 'float', min: 0.1,  max: 5.0, step: 0.01 },
                { key: 'fSuspensionUpperLimit',   type: 'float', min: -0.5, max: 0.5, step: 0.01 },
                { key: 'fSuspensionLowerLimit',   type: 'float', min: -0.5, max: 0.1, step: 0.01 },
                { key: 'fSuspensionRaise',        type: 'float', min: -0.2, max: 0.5, step: 0.01 },
                { key: 'fSuspensionBiasFront',    type: 'float', min: 0.0,  max: 1.0, step: 0.01 },
                { type: 'divider', label: 'เหล็กกันโคลง & จุดศูนย์ถ่วงเอียง (Anti-Roll)' },
                { key: 'fAntiRollBarForce',       type: 'float', min: 0.0,  max: 5.0, step: 0.01 },
                { key: 'fAntiRollBarBiasFront',   type: 'float', min: 0.0,  max: 1.0, step: 0.01 },
                { key: 'fRollCentreHeightFront',  type: 'float', min: -0.5, max: 1.0, step: 0.01 },
                { key: 'fRollCentreHeightRear',   type: 'float', min: -0.5, max: 1.0, step: 0.01 }
            ]
        },
        {
            id: 'mass',
            label: 'มวล & จุดศูนย์ถ่วง',
            fields: [
                { type: 'divider', label: 'น้ำหนัก & อากาศพลศาสตร์ (Mass & Aero)' },
                { key: 'fMass',              type: 'float', min: 100,  max: 10000, step: 10  },
                { key: 'fInitialDragCoeff',  type: 'float', min: 0.1,  max: 200.0, step: 0.1 },
                { key: 'fPercentSubmerged',  type: 'float', min: 10,   max: 100,   step: 1   },
                { type: 'divider', label: 'จุดศูนย์ถ่วง (Centre of Mass Offset)' },
                { key: 'vecCentreOfMassOffset.x', field: 'vecCentreOfMassOffset', axis: 'x', type: 'vector', min: -5.0, max: 5.0, step: 0.01 },
                { key: 'vecCentreOfMassOffset.y', field: 'vecCentreOfMassOffset', axis: 'y', type: 'vector', min: -5.0, max: 5.0, step: 0.01 },
                { key: 'vecCentreOfMassOffset.z', field: 'vecCentreOfMassOffset', axis: 'z', type: 'vector', min: -5.0, max: 5.0, step: 0.01 },
                { type: 'divider', label: 'แรงเฉื่อยการหมุน (Inertia Multipliers)' },
                { key: 'vecInertiaMultiplier.x', field: 'vecInertiaMultiplier', axis: 'x', type: 'vector', min: 0.0, max: 5.0, step: 0.01 },
                { key: 'vecInertiaMultiplier.y', field: 'vecInertiaMultiplier', axis: 'y', type: 'vector', min: 0.0, max: 5.0, step: 0.01 },
                { key: 'vecInertiaMultiplier.z', field: 'vecInertiaMultiplier', axis: 'z', type: 'vector', min: 0.0, max: 5.0, step: 0.01 }
            ]
        },
        {
            id: 'damage',
            label: 'ความเสียหาย & ของเหลว',
            fields: [
                { type: 'divider', label: 'ตัวคูณความเสียหาย (Damage Multipliers)' },
                { key: 'fCollisionDamageMult',    type: 'float', min: 0.0, max: 10.0,  step: 0.01 },
                { key: 'fWeaponDamageMult',       type: 'float', min: 0.0, max: 10.0,  step: 0.01 },
                { key: 'fDeformationDamageMult',  type: 'float', min: 0.0, max: 10.0,  step: 0.01 },
                { key: 'fEngineDamageMult',       type: 'float', min: 0.0, max: 10.0,  step: 0.01 },
                { type: 'divider', label: 'ของเหลว & ถังน้ำมัน (Fluids)' },
                { key: 'fPetrolTankVolume',       type: 'float', min: 0.0, max: 200.0, step: 1.0  },
                { key: 'fOilVolume',              type: 'float', min: 0.0, max: 20.0,  step: 0.1  },
                { type: 'divider', label: 'ตำแหน่งเบาะนั่ง (Seat Offsets)' },
                { key: 'fSeatOffsetDistX',        type: 'float', min: -1.0, max: 1.0, step: 0.01 },
                { key: 'fSeatOffsetDistY',        type: 'float', min: -1.0, max: 1.0, step: 0.01 },
                { key: 'fSeatOffsetDistZ',        type: 'float', min: -1.0, max: 1.0, step: 0.01 }
            ]
        },
        {
            id: 'advanced',
            label: 'ข้อมูลจำเพาะ & แฟล็ก',
            fields: [
                { type: 'divider', label: 'ข้อมูลระบุตัวรถ & AI (Identifiers)' },
                { key: 'handlingName',      type: 'text', placeholder: 'e.g. ELEGY', defaultVal: '' },
                { key: 'AIHandling',        type: 'text', placeholder: 'AVERAGE',   defaultVal: 'AVERAGE' },
                { key: 'nMonetaryValue',    type: 'int',  min: 0, max: 10000000, step: 100 },
                { type: 'divider', label: 'แฟล็กคุณลักษณะ (Flags - รหัส Hex)' },
                { key: 'strModelFlags',     type: 'text', placeholder: '440010',   defaultVal: '0' },
                { key: 'strHandlingFlags',  type: 'text', placeholder: '20002',    defaultVal: '0' },
                { key: 'strDamageFlags',    type: 'text', placeholder: '0',        defaultVal: '0' },
                { type: 'divider', label: 'ข้อมูลเสริม CCarHandlingData (SubHandlingData)' },
                { key: 'fBackEndPopUpCarImpulseMult',      type: 'subfloat', min: 0.0, max: 2.0, step: 0.001 },
                { key: 'fBackEndPopUpBuildingImpulseMult', type: 'subfloat', min: 0.0, max: 2.0, step: 0.001 },
                { key: 'fBackEndPopUpMaxDeltaSpeed',       type: 'subfloat', min: 0.0, max: 2.0, step: 0.001 }
            ]
        }
    ];

    // ─────────────────────────────────────────────────────────────────────────
    //  STATE (DRAFT & COMMITTED)
    // ─────────────────────────────────────────────────────────────────────────

    const initialState = {}; // Baseline vehicle handling values (committed)
    const draftState   = {}; // Working copy edited in the UI (uncommitted)

    // ─────────────────────────────────────────────────────────────────────────
    //  DOM REFERENCES
    // ─────────────────────────────────────────────────────────────────────────

    const container     = document.getElementById('tuner-container');
    const tabNav        = document.getElementById('tab-nav');
    const tabContent    = document.getElementById('tab-content');
    const btnSave       = document.getElementById('btn-save');
    const btnSaveLbl    = document.getElementById('btn-save-label');
    const btnClose      = document.getElementById('btn-close');
    const toastEl       = document.getElementById('toast');

    // Tooltip DOM elements
    const tooltipEl     = document.getElementById('tuner-tooltip');
    const tooltipTitle  = document.getElementById('tooltip-title');
    const tooltipTag    = document.getElementById('tooltip-tag');
    const tooltipDesc   = document.getElementById('tooltip-desc');
    const tooltipUpRow  = document.getElementById('tooltip-up-row');
    const tooltipUpTxt  = document.getElementById('tooltip-up-text');
    const tooltipDnRow  = document.getElementById('tooltip-down-row');
    const tooltipDnTxt  = document.getElementById('tooltip-down-text');

    // ─────────────────────────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    function nuiUrl(endpoint) {
        const res = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'car_tuner';
        return `https://${res}/${endpoint}`;
    }

    function nuiPost(endpoint, body) {
        fetch(nuiUrl(endpoint), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify(body)
        }).catch(() => {});
    }

    /** Number of decimal places implied by a step value. */
    function decimalsFromStep(step) {
        const s = String(step);
        const dot = s.indexOf('.');
        return dot === -1 ? 0 : s.length - dot - 1;
    }

    /** Round a value to the precision implied by step. */
    function roundToStep(value, step) {
        const d = decimalsFromStep(step);
        return parseFloat(Number(value).toFixed(d));
    }

    let toastTimer = null;

    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 2400);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  FLOATING TOOLTIP HANDLER
    // ─────────────────────────────────────────────────────────────────────────

    function showTooltip(key, anchorEl) {
        const dict = HANDLING_DICTIONARY[key];
        if (!dict || !tooltipEl) return;

        tooltipTitle.textContent = dict.label;
        tooltipTag.textContent   = key;
        tooltipDesc.textContent  = dict.desc || '';

        if (dict.up) {
            tooltipUpRow.style.display = 'flex';
            tooltipUpTxt.textContent   = dict.up;
        } else {
            tooltipUpRow.style.display = 'none';
        }

        if (dict.down) {
            tooltipDnRow.style.display = 'flex';
            tooltipDnTxt.textContent   = dict.down;
        } else {
            tooltipDnRow.style.display = 'none';
        }

        // Positioning logic: prefer placing to the left of the tuner panel
        const rect = anchorEl.getBoundingClientRect();
        const tipWidth = 320;
        
        let left = rect.left - tipWidth - 14;
        if (left < 16) {
            // If near the left edge, position on the right of the anchor or clamp
            left = rect.right + 14;
            if (left + tipWidth > window.innerWidth - 16) {
                left = window.innerWidth - tipWidth - 16;
            }
        }

        let top = rect.top - 6;
        if (top + 220 > window.innerHeight) {
            top = window.innerHeight - 230;
        }
        if (top < 16) top = 16;

        tooltipEl.style.left = `${Math.round(left)}px`;
        tooltipEl.style.top  = `${Math.round(top)}px`;
        tooltipEl.classList.add('visible');
    }

    function hideTooltip() {
        if (tooltipEl) {
            tooltipEl.classList.remove('visible');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  UI GENERATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generates the inner HTML for a single field card.
     * @param {object} f  Field definition from TABS.
     * @returns {string}  HTML string.
     */
    function fieldCardHtml(f) {
        if (f.type === 'divider') {
            return `<div class="section-divider"><span>${f.label}</span></div>`;
        }

        const tag = f.field ? `${f.field}.${f.axis}` : f.key;
        const dict = HANDLING_DICTIONARY[f.key] || {};
        const label = dict.label || f.label || f.key;
        const hint = dict.desc || f.hint || '';

        const dataAttrs = [
            `data-key="${f.key}"`,
            `data-type="${f.type}"`,
            f.field ? `data-field="${f.field}"` : '',
            f.axis  ? `data-axis="${f.axis}"`   : ''
        ].filter(Boolean).join(' ');

        if (f.type === 'text') {
            return `
                <div class="field-card" ${dataAttrs}>
                    <div class="field-header" data-tooltip-key="${f.key}">
                        <div class="field-label-group">
                            <span class="field-label" title="${label}">${label}</span>
                            <span class="field-info-btn" data-tooltip-key="${f.key}" title="คำอธิบายการปรับแต่ง">?</span>
                        </div>
                        <code class="field-tag">${f.key}</code>
                    </div>
                    <div class="field-control field-control--text">
                        <input type="text" class="field-text"
                               value="${f.defaultVal || ''}"
                               placeholder="${f.placeholder || ''}" />
                    </div>
                    ${hint ? `<div class="field-hint" title="${hint}">${hint}</div>` : ''}
                </div>`;
        }

        // float / int / vector / subfloat — slider + number input
        const mid = roundToStep((f.min + f.max) / 2, f.step);
        return `
            <div class="field-card" ${dataAttrs}>
                <div class="field-header" data-tooltip-key="${f.key}">
                    <div class="field-label-group">
                        <span class="field-label" title="${label}">${label}</span>
                        <span class="field-info-btn" data-tooltip-key="${f.key}" title="คำอธิบายการปรับแต่ง">?</span>
                    </div>
                    <code class="field-tag">${tag}</code>
                </div>
                <div class="field-control">
                    <input type="range" class="field-slider"
                           min="${f.min}" max="${f.max}" step="${f.step}" value="${mid}" />
                    <input type="number" class="field-number"
                           min="${f.min}" max="${f.max}" step="${f.step}" value="${mid}" />
                </div>
                ${hint ? `<div class="field-hint" title="${hint}">${hint}</div>` : ''}
            </div>`;
    }

    /** Builds the entire tabbed interface. */
    function buildUI() {
        // Tab buttons
        tabNav.innerHTML = TABS.map((tab, i) =>
            `<button class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${tab.id}">${tab.label}</button>`
        ).join('');

        // Tab panes
        tabContent.innerHTML = TABS.map((tab, i) =>
            `<div class="tab-pane${i === 0 ? ' active' : ''}" data-tab="${tab.id}">
                ${tab.fields.map(f => fieldCardHtml(f)).join('')}
             </div>`
        ).join('');

        // Wire tab clicks
        tabNav.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        // Wire field interactions
        // Wire field interactions (Draft mode: updates local draftState only)
        tabContent.querySelectorAll('.field-card').forEach(card => {
            const key    = card.dataset.key;
            const slider = card.querySelector('.field-slider');
            const num    = card.querySelector('.field-number');
            const text   = card.querySelector('.field-text');

            if (slider && num) {
                if (draftState[key] === undefined) {
                    draftState[key] = parseFloat(slider.value);
                }

                slider.addEventListener('input', () => {
                    num.value = slider.value;
                    draftState[key] = parseFloat(slider.value);
                    // DRAFT MODE: No native NUI call is made here.
                    // Physics remain unchanged until player clicks "Save Tuning".
                });

                num.addEventListener('input', () => {
                    slider.value = num.value;
                    draftState[key] = parseFloat(num.value);
                    // DRAFT MODE: No native NUI call is made here.
                });
            }

            if (text) {
                if (draftState[key] === undefined) {
                    draftState[key] = text.value;
                }
                text.addEventListener('input', () => {
                    draftState[key] = text.value;
                });
            }
        });

        // Wire tooltip hover events
        tabContent.querySelectorAll('.field-info-btn, .field-header').forEach(el => {
            const key = el.dataset.tooltipKey;
            if (!key) return;

            el.addEventListener('mouseenter', () => showTooltip(key, el));
            el.addEventListener('mouseleave', hideTooltip);
        });

        // Horizontal mouse wheel scrolling for tab bar
        tabNav.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                tabNav.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }

    function switchTab(tabId) {
        hideTooltip();
        tabNav.querySelectorAll('.tab-btn').forEach(b => {
            const isActive = b.dataset.tab === tabId;
            b.classList.toggle('active', isActive);
            if (isActive) {
                b.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }
        });
        tabContent.querySelectorAll('.tab-pane').forEach(p =>
            p.classList.toggle('active', p.dataset.tab === tabId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  DRAFT MANAGEMENT & SYNC
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Applies a snapshot of handling values received from Lua.
     * Initializes both initialState (committed baseline) and draftState.
     * @param {object} handling  Map of handling field keys to numeric/string values.
     */
    function applySnapshot(handling) {
        if (!handling) return;

        for (const [key, val] of Object.entries(handling)) {
            initialState[key] = val;
            draftState[key]   = val;

            const card = tabContent.querySelector(`.field-card[data-key="${key}"]`);
            if (!card) continue;

            const slider = card.querySelector('.field-slider');
            const num    = card.querySelector('.field-number');
            const text   = card.querySelector('.field-text');

            if (slider && num) {
                const step = parseFloat(slider.step) || 0.01;
                const rounded = roundToStep(val, step);
                slider.value = rounded;
                num.value    = rounded;
            } else if (text) {
                text.value = val;
            }
        }
    }

    /**
     * Discards uncommitted draft values and reverts all inputs back to initialState.
     */
    function discardDraft() {
        Object.assign(draftState, initialState);

        for (const [key, val] of Object.entries(initialState)) {
            const card = tabContent.querySelector(`.field-card[data-key="${key}"]`);
            if (!card) continue;

            const slider = card.querySelector('.field-slider');
            const num    = card.querySelector('.field-number');
            const text   = card.querySelector('.field-text');

            if (slider && num) {
                const step = parseFloat(slider.step) || 0.01;
                const rounded = roundToStep(val, step);
                slider.value = rounded;
                num.value    = rounded;
            } else if (text) {
                text.value = val;
            }
        }
    }

    /**
     * Closes the NUI editor and discards uncommitted draft values.
     */
    function closeUI() {
        hideTooltip();
        discardDraft();
        nuiPost('closeUI', {});
        container.classList.add('hidden');
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  ACTION BUTTONS & KEY EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    // Save Tuning: commit draft to vehicle physics & state bag
    btnSave.addEventListener('click', () => {
        // Send all draft values to Lua callback
        nuiPost('saveHandling', draftState);

        showToast('บันทึกค่าจูนสำเร็จ! กำลังปรับแต่งรถ...');

        btnSave.classList.add('saved');
        btnSaveLbl.textContent = 'บันทึกสำเร็จ!';

        // Commit draft as new baseline
        Object.assign(initialState, draftState);

        setTimeout(() => {
            btnSave.classList.remove('saved');
            btnSaveLbl.textContent = 'บันทึกค่าจูน (Save Tuning)';
        }, 1800);
    });

    // Close button: cancel and discard uncommitted changes
    btnClose.addEventListener('click', () => {
        closeUI();
    });

    // Escape key: cancel and discard uncommitted changes
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeUI();
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    //  MESSAGE LISTENER (FiveM NUI)
    // ─────────────────────────────────────────────────────────────────────────

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || !data.action) return;

        switch (data.action) {
            case 'open':
            case 'openUI':
                applySnapshot(data.handling || data.values);
                container.classList.remove('hidden');
                break;

            case 'close':
            case 'closeUI':
                closeUI();
                break;
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    //  INIT
    // ─────────────────────────────────────────────────────────────────────────

    buildUI();

    // Auto-display in standalone browser preview (outside FiveM CEF environment)
    if (typeof GetParentResourceName !== 'function') {
        container.classList.remove('hidden');
    }

})();

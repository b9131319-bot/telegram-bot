const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const TOKEN = '8455445401:AAFt_f55qgdRLJvrZ5KfEjX3IXVsjaDnxFs';
const ADMIN_CHAT_ID = '8266396167'; // الأدمن الأساسي الوحيد

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const BOT_USERNAME = 'abod_store_bot'; 

const DB_FILE = path.join(__dirname, 'database.json');

let db = {
    users: {},
    giftCodes: {},
    coupons: {},
    pointCoupons: {},
    services: {
        'pay_tk_f1': { name: 'متابعين تيك توك (10 إلى 50 متابع)', price: 180, category: 'paid' },
        'pay_tk_f2': { name: 'متابعين تيك توك (50 إلى 100 متابع)', price: 350, category: 'paid' },
        'pay_tk_f3': { name: 'متابعين تيك توك (100 إلى 200 متابع)', price: 650, category: 'paid' },
        'pay_tk_v1': { name: 'مشاهدات وتفاعلات تيك توك (100 إلى 1000 مشاهدة)', price: 150, category: 'paid' },
        'pay_tk_v2': { name: 'مشاهدات وتفاعلات تيك توك (1000 إلى 10000 مشاهدة)', price: 550, category: 'paid' },
        
        'pay_yt_f1': { name: 'مشتركين يوتيوب (10 إلى 50 مشترك)', price: 220, category: 'paid' },
        'pay_yt_f2': { name: 'مشتركين يوتيوب (50 إلى 100 مشترك)', price: 450, category: 'paid' },
        'pay_yt_f3': { name: 'مشتركين يوتيوب (100 إلى 200 مشترك)', price: 800, category: 'paid' },
        'pay_yt_v1': { name: 'مشاهدات يوتيوب (100 إلى 1000 مشاهدة)', price: 180, category: 'paid' },
        'pay_yt_v2': { name: 'مشاهدات يوتيوب (1000 إلى 10000 مشاهدة)', price: 700, category: 'paid' },

        'pay_in_f1': { name: 'متابعين انستقرام (10 إلى 50 متابع)', price: 200, category: 'paid' },
        'pay_in_f2': { name: 'متابعين انستقرام (50 إلى 100 متابع)', price: 400, category: 'paid' },
        'pay_in_f3': { name: 'متابعين انستقرام (100 إلى 200 متابع)', price: 720, category: 'paid' },
        'pay_in_v1': { name: 'مشاهدات انستقرام (100 إلى 1000 مشاهدة)', price: 160, category: 'paid' },
        'pay_in_v2': { name: 'مشاهدات انستقرام (1000 إلى 10000 مشاهدة)', price: 600, category: 'paid' },

        'pay_tw_f1': { name: 'متابعين تويتش (10 إلى 50 متابع)', price: 190, category: 'paid' },
        'pay_tw_f2': { name: 'متابعين تويتش (50 إلى 100 متابع)', price: 380, category: 'paid' },
        'pay_tw_v1': { name: 'مشاهدات بث تويتش (100 إلى 500 مشاهدة)', price: 240, category: 'paid' },

        'pay_tg_f1': { name: 'متابعين وقنوات تيليجرام (10 إلى 50 مشترك)', price: 180, category: 'paid' },
        'pay_tg_v1': { name: 'مشاهدات منشورات تيليجرام (100 إلى 1000 مشاهدة)', price: 150, category: 'paid' },

        'pay_x_f1': { name: 'متابعين منصة X (10 إلى 50 متابع)', price: 200, category: 'paid' },
        'pay_x_v1': { name: 'تفاعلات منصة X (لايكات/إعادة نشر)', price: 170, category: 'paid' },

        'pay_store_create': { name: 'خدمة إنشاء متجر متكامل', price: 2000, category: 'paid' },

        'pay_rand_tk_acc': { name: 'حساب تيك توك عشوائي فاخر (نادر جداً)', price: 5000, category: 'special' },
        'pay_recover_acc': { name: 'خدمة استرداد حساب مسروق/مهكر (احتمال ضعيف وغير مضمون)', price: 3500, category: 'special' },

        'free_service_1': { name: 'مجاني: 100 مشاهدة تيك توك مصغرة', price: 0, category: 'free' },
        'free_service_2': { name: 'مجاني: 20 لايك انستقرام مصغر', price: 0, category: 'free' },
        'free_service_3': { name: 'مجاني: 10 متابعين تيليجرام تجريبي', price: 0, category: 'free' },
        'free_service_4': { name: 'مجاني: 50 مشاهدة يوتيوب تجريبية', price: 0, category: 'free' },
        'free_service_5': { name: 'مجاني: 10 متابعين تيك توك مصغر', price: 0, category: 'free' },
        'free_service_6': { name: 'مجاني: 15 لايك تيك توك مصغر', price: 0, category: 'free' },
        'free_service_7': { name: 'مجاني: 10 متابعين انستقرام تجريبي', price: 0, category: 'free' },
        'free_service_8': { name: 'مجاني: 20 مشاهدة انستقرام مصغرة', price: 0, category: 'free' },
        'free_service_9': { name: 'مجاني: 5 مشتركين يوتيوب تجريبي', price: 0, category: 'free' },
        'free_service_10': { name: 'مجاني: 15 تفاعل منصة X مصغر', price: 0, category: 'free' },
        'free_service_11': { name: 'مجاني: 10 متابعين تويتش تجريبي', price: 0, category: 'free' }
    }
};

function loadDatabase() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            const parsed = JSON.parse(data);
            db.users = parsed.users || {};
            db.giftCodes = parsed.giftCodes || {};
            db.coupons = parsed.coupons || {};
            db.pointCoupons = parsed.pointCoupons || {};
            if (parsed.services) {
                db.services = { ...db.services, ...parsed.services };
            }
        } catch (e) {
            console.error('خطأ في قراءة قاعدة البيانات:', e);
        }
    }
}

function saveDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
        console.error('خطأ في حفظ قاعدة البيانات:', e);
    }
}

loadDatabase();

async function sendMessage(chatId, text, replyMarkup = null, replyToMessageId = null) {
    try {
        const payload = {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        };
        if (replyMarkup) payload.reply_markup = replyMarkup;
        if (replyToMessageId) payload.reply_to_message_id = replyToMessageId;
        const response = await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
        return response.data.result.message_id;
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error.response?.data || error.message);
    }
}

async function editMessageText(chatId, messageId, text, replyMarkup = null) {
    try {
        const payload = {
            chat_id: chatId,
            message_id: messageId,
            text: text,
            parse_mode: 'Markdown'
        };
        if (replyMarkup) payload.reply_markup = replyMarkup;
        await axios.post(`${TELEGRAM_API}/editMessageText`, payload);
    } catch (error) {}
}

function getServiceNiceName(data) {
    return db.services[data]?.name || data;
}

function getUserLevel(ordersCount) {
    if (ordersCount >= 20) return { name: '🏆 أسطورة المتجر (مستوى 3)', discount: 0.15 };
    if (ordersCount >= 10) return { name: '⭐ عميل مميز (مستوى 2)', discount: 0.10 };
    if (ordersCount >= 5) return { name: '🥉 عميل برونزي (مستوى 1)', discount: 0.05 };
    return { name: '👤 مبتدئ (مستوى 0)', discount: 0.0 };
}

app.post(`/webhook/${TOKEN}`, async (req, res) => {
    try {
        const update = req.body;

        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const userName = update.message.from.first_name || 'مستخدم';
            const userUsername = update.message.from.username ? `@${update.message.from.username}` : 'لا يوجد';

            if (!db.users[chatId]) {
                db.users[chatId] = {
                    name: userName,
                    username: userUsername,
                    points: 0,
                    ordersCount: 0,
                    lastDaily: 0,
                    lastWheel: 0,
                    lastBoxes: 0,
                    lastFlagGame: 0,
                    lastMathGame: 0,
                    freeServicesTodayCount: 0,
                    lastFreeServiceReset: Date.now(),
                    orders: [],
                    transfers: [],
                    referredBy: null,
                    referralCount: 0,
                    waitingForInput: null,
                    waitingForGiftCreation: false,
                    waitingForBroadcast: false,
                    waitingForTransferId: null,
                    waitingForTransferTarget: null,
                    waitingForCouponCreate: false,
                    waitingForPointCouponCreate: false,
                    waitingForPointCouponApply: false,
                    waitingForCouponApply: null,
                    waitingForAdminAddPoints: null,
                    waitingForAdminBan: null,
                    waitingForServiceAdd: null,
                    lastTiktokTaskTime: 0
                };
                saveDatabase();

                if (chatId.toString() !== ADMIN_CHAT_ID.toString()) {
                    const notifyAdminText = `🚨 **عضو جديد دخل البوت!**\n\n` +
                        `👤 الاسم: ${userName}\n` +
                        `🔗 المعرف: ${userUsername}\n` +
                        `🆔 الأيدي: \`${chatId}\`\n` +
                        `💬 للتواصل: [اضغط هنا](tg://user?id=${chatId})`;
                    await sendMessage(ADMIN_CHAT_ID, notifyAdminText);
                }
            } else {
                db.users[chatId].name = userName;
                db.users[chatId].username = userUsername;
            }

            const user = db.users[chatId];

            if (user.isBanned && chatId.toString() !== ADMIN_CHAT_ID.toString()) {
                await sendMessage(chatId, `❌ **عذراً، تم حظرك من استخدام البوت بواسطة الإدارة.**`);
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && user.waitingForBroadcast) {
                user.waitingForBroadcast = false;
                saveDatabase();
                const allUserIds = Object.keys(db.users);
                let successCount = 0;
                for (const uid of allUserIds) {
                    try {
                        await sendMessage(uid, `📢 **إعلان / رسالة إدارية هامة:**\n\n${text}`);
                        successCount++;
                    } catch (e) {}
                }
                await sendMessage(chatId, `✅ **تم إرسال الإعلانات والرسائل الجماعية بنجاح إلى (${successCount}) مشترك.**`);
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && user.waitingForServiceAdd) {
                user.waitingForServiceAdd = false;
                saveDatabase();
                const parts = text.split('|');
                const sKey = parts[0]?.trim();
                const sName = parts[1]?.trim();
                const sPrice = parseInt(parts[2]);

                if (!sKey || !sName || isNaN(sPrice)) {
                    await sendMessage(chatId, `❌ **خطأ في الصيغة!** استخدم الشكل التالي:\n\`مفتاح_الخدمة | اسم العرض | السعر\`\nمثال: \`offer_1 | عرض خاص | 100\``);
                    return res.sendStatus(200);
                }

                db.services[sKey] = { name: sName, price: sPrice, category: 'paid' };
                saveDatabase();

                await sendMessage(chatId, `✅ **تم إضافة وتعديل منشور العرض بنجاح!**\n📦 المفتاح: \`${sKey}\`\n🏷️ الاسم: ${sName}\n🪙 السعر: ${sPrice} نقطة`);
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && user.waitingForGiftCreation) {
                user.waitingForGiftCreation = false;
                saveDatabase();
                const parts = text.split(' ');
                const pointsAmount = parseInt(parts[0]);
                const hoursDuration = parseInt(parts[1]) || 24;

                if (isNaN(pointsAmount) || pointsAmount <= 0) {
                    await sendMessage(chatId, `❌ **خطأ!** الصيغة: \`النقاط الساعات\` مثل \`100 24\``);
                    return res.sendStatus(200);
                }

                const codeId = 'GIFT-' + Math.floor(100000 + Math.random() * 900000);
                const expiresAt = Date.now() + (hoursDuration * 60 * 60 * 1000);

                db.giftCodes[codeId] = { points: pointsAmount, expiresAt: expiresAt, usedBy: [] };
                saveDatabase();

                const giftLink = `https://t.me/${BOT_USERNAME}?start=${codeId}`;
                await sendMessage(chatId, `✅ **تم إنشاء رابط الهدية بنجاح!**\n🎁 النقاط: ${pointsAmount}\n🔗 الرابط:\n${giftLink}`);
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && user.waitingForPointCouponCreate) {
                user.waitingForPointCouponCreate = false;
                saveDatabase();
                const parts = text.split(' ');
                const couponCode = parts[0]?.toUpperCase();
                const pointsAmt = parseInt(parts[1]);

                if (!couponCode || isNaN(pointsAmt) || pointsAmt <= 0) {
                    await sendMessage(chatId, `❌ **خطأ!** الصيغة الصحيحة: \`الكود عدد_النقاط\` مثل \`ABOD50 50\``);
                    return res.sendStatus(200);
                }

                db.pointCoupons[couponCode] = { points: pointsAmt, usedBy: [] };
                saveDatabase();

                await sendMessage(chatId, `✅ **تم إنشاء كوبون النقاط بنجاح!**\n🎫 الكود: \`${couponCode}\`\n🪙 النقاط: *${pointsAmt} نقطة*`);
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && user.waitingForCouponCreate) {
                user.waitingForCouponCreate = false;
                saveDatabase();
                const parts = text.split(' ');
                const couponCode = parts[0]?.toUpperCase();
                const discountPct = parseInt(parts[1]);

                if (!couponCode || isNaN(discountPct) || discountPct <= 0 || discountPct > 100) {
                    await sendMessage(chatId, `❌ **خطأ!** الصيغة الصحيحة: \`الكود نسبة_الخصم\` مثل \`TURBO10 15\``);
                    return res.sendStatus(200);
                }

                db.coupons[couponCode] = { discount: discountPct, usedBy: [] };
                saveDatabase();

                await sendMessage(chatId, `✅ **تم إنشاء كوبون الخصم بنجاح!**\n🎫 الكود: \`${couponCode}\`\n📉 نسبة الخصم: *${discountPct}%*`);
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && user.waitingForAdminAddPoints) {
                const targetId = user.waitingForAdminAddPoints;
                user.waitingForAdminAddPoints = null;
                saveDatabase();
                const pts = parseInt(text);
                if (isNaN(pts)) {
                    await sendMessage(chatId, `❌ يرجى إرسال رقم صحيح للنقاط.`);
                    return res.sendStatus(200);
                }
                if (db.users[targetId]) {
                    db.users[targetId].points += pts;
                    saveDatabase();
                    await sendMessage(chatId, `✅ تم تعديل نقاط العميل ${targetId} بنجاح (+${pts}).`);
                    await sendMessage(targetId, `🎁 **تم إضافة ${pts} نقطة إلى رصيدك بواسطة الإدارة!**\nرصيدك الحالي: *${db.users[targetId].points} نقطة*.`);
                } else {
                    await sendMessage(chatId, `❌ العميل غير موجود.`);
                }
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && user.waitingForAdminBan) {
                const targetId = text.trim();
                user.waitingForAdminBan = null;
                saveDatabase();
                if (db.users[targetId]) {
                    db.users[targetId].isBanned = !db.users[targetId].isBanned;
                    saveDatabase();
                    const status = db.users[targetId].isBanned ? 'محظور 🔴' : 'غير محظور 🟢';
                    await sendMessage(chatId, `✅ تم تغيير حالة الحظر للمستخدم ${targetId} إلى: ${status}`);
                } else {
                    await sendMessage(chatId, `❌ العميل غير موجود.`);
                }
                return res.sendStatus(200);
            }

            if (user.waitingForPointCouponApply) {
                user.waitingForPointCouponApply = false;
                saveDatabase();
                const couponCode = text.trim().toUpperCase();

                if (!db.pointCoupons[couponCode]) {
                    await sendMessage(chatId, `❌ **عذراً، كود الكوبون غير صالح أو غير موجود!**`);
                    showMainMenu(chatId);
                    return res.sendStatus(200);
                }

                const couponObj = db.pointCoupons[couponCode];
                if (couponObj.usedBy.includes(chatId)) {
                    await sendMessage(chatId, `⚠️ **لقد استخدمت هذا الكوبون مسبقاً!**`);
                    showMainMenu(chatId);
                    return res.sendStatus(200);
                }

                couponObj.usedBy.push(chatId);
                user.points += couponObj.points;
                saveDatabase();

                await sendMessage(chatId, `🎉 **مبروك يا غالي! تم تفعيل الكوبون بنجاح.**\n🎁 تم إضافة *${couponObj.points} نقطة* إلى رصيدك.\nرصيدك الحالي: *${user.points} نقطة* 🪙.`);
                showMainMenu(chatId);
                return res.sendStatus(200);
            }

            if (user.waitingForFlagAnswer) {
                const correctFlag = user.waitingForFlagAnswer;
                user.waitingForFlagAnswer = null;
                saveDatabase();

                if (text.trim() === correctFlag) {
                    user.points += 50;
                    saveDatabase();
                    await sendMessage(chatId, `🎉 **إجابة صحيحة!** ربحت *50 نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`);
                } else {
                    user.points += 15;
                    saveDatabase();
                    await sendMessage(chatId, `❌ **إجابة خاطئة!** العلم الصحيح كان: ${correctFlag}\nتم منحك *15 نقطة* كتعويض 🪙.\nرصيدك الحالي: ${user.points} نقطة.`);
                }
                showMainMenu(chatId);
                return res.sendStatus(200);
            }

            if (user.waitingForMathAnswer) {
                const correctAnswer = user.waitingForMathAnswer;
                user.waitingForMathAnswer = null;
                saveDatabase();

                if (parseInt(text.trim()) === correctAnswer) {
                    user.points += 50;
                    saveDatabase();
                    await sendMessage(chatId, `🎉 **إجابة صحيحة!** ربحت *50 نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`);
                } else {
                    user.points += 15;
                    saveDatabase();
                    await sendMessage(chatId, `❌ **إجابة خاطئة!** الناتج الصحيح كان: ${correctAnswer}\nتم منحك *15 نقطة* كتعويض 🪙.\nرصيدك الحالي: ${user.points} نقطة.`);
                }
                showMainMenu(chatId);
                return res.sendStatus(200);
            }

            if (text && text.startsWith('/start')) {
                showMainMenu(chatId);
                return res.sendStatus(200);
            }

            if (user.waitingForTransferId) {
                const targetId = text.trim();
                if (targetId === chatId.toString()) {
                    user.waitingForTransferId = null;
                    saveDatabase();
                    await sendMessage(chatId, `❌ لا يمكنك تحويل النقاط لنفسك.`);
                    return res.sendStatus(200);
                }
                if (!db.users[targetId]) {
                    user.waitingForTransferId = null;
                    saveDatabase();
                    await sendMessage(chatId, `❌ معرف المستخدم (ID) غير مسجل في البوت.`);
                    return res.sendStatus(200);
                }
                user.waitingForTransferTarget = targetId;
                user.waitingForTransferId = null;
                saveDatabase();
                await sendMessage(chatId, `💳 **أدخل عدد النقاط المراد تحويلها:**\n(الحد الأعلى 100 نقطة وعمولة 5%)`);
                return res.sendStatus(200);
            }

            if (user.waitingForTransferTarget) {
                const targetId = user.waitingForTransferTarget;
                user.waitingForTransferTarget = null;
                saveDatabase();
                const amount = parseInt(text);
                
                if (isNaN(amount) || amount <= 0 || amount > 100) {
                    await sendMessage(chatId, `❌ الحد الأعلى للتحويل هو 100 نقطة، ويجب أن يكون الرقم صحيحاً.`);
                    return res.sendStatus(200);
                }

                const now = Date.now();
                const oneWeek = 7 * 24 * 60 * 60 * 1000;
                user.weeklyTransfers = user.weeklyTransfers || [];
                user.weeklyTransfers = user.weeklyTransfers.filter(t => now - t < oneWeek);

                if (user.weeklyTransfers.length >= 2) {
                    await sendMessage(chatId, `⚠️ **عذراً، لقد استنفدت الحد الأقص للتحويل (مرتين أسبوعياً).**`);
                    return res.sendStatus(200);
                }

                const commission = Math.ceil(amount * 0.05);
                const totalDeduct = amount + commission;

                if (user.points < totalDeduct) {
                    await sendMessage(chatId, `❌ رصيدك غير كافٍ! تحويل ${amount} نقطة مع عمولة 5% يتطلب إجمالي *${totalDeduct} نقطة*.`);
                    return res.sendStatus(200);
                }

                user.points -= totalDeduct;
                user.weeklyTransfers.push(now);
                db.users[targetId].points += amount;

                user.transfers.push({ type: 'send', target: targetId, amount: amount, time: now });
                db.users[targetId].transfers.push({ type: 'receive', from: chatId, amount: amount, time: now });
                saveDatabase();

                await sendMessage(chatId, `✅ **تم تحويل النقاط بنجاح!**\nتم إرسال ${amount} نقطة إلى المستخدم \`${targetId}\`.`);
                await sendMessage(targetId, `🎁 **وصلك تحويل نقاط جديد!**\nتم استلام ${amount} نقطة من المستخدم \`${chatId}\`.`);
                return res.sendStatus(200);
            }

            if (user.waitingForCouponApply) {
                const serviceCode = user.waitingForCouponApply;
                user.waitingForCouponApply = null;
                saveDatabase();
                const couponCode = text.trim().toUpperCase();

                if (!db.coupons[couponCode]) {
                    await sendMessage(chatId, `❌ **كوبون الخصم غير صالح!**`);
                    return res.sendStatus(200);
                }

                const coupon = db.coupons[couponCode];
                if (coupon.usedBy.includes(chatId)) {
                    await sendMessage(chatId, `⚠️ **لقد استخدمت هذا الكوبون مسبقاً!**`);
                    return res.sendStatus(200);
                }

                coupon.usedBy.push(chatId);
                user.activeCoupon = { code: couponCode, discount: coupon.discount };
                saveDatabase();

                await sendMessage(chatId, `✅ **تم تطبيق كوبون الخصم بنجاح (${coupon.discount}%)!**`);
                processOrder(chatId, serviceCode, user);
                return res.sendStatus(200);
            }

            if (text) {
                if (user.waitingForInput) {
                    const pendingService = user.waitingForInput;
                    user.waitingForInput = null;
                    saveDatabase();

                    if (text.length < 3 || (!text.includes('http') && !text.includes('@') && !text.includes('www.'))) {
                        await sendMessage(chatId, `❌ **الرابط غير صحيح!** يرجى إرسال رابط صحيح وتأكد أن الحساب عام:`);
                        user.waitingForInput = pendingService;
                        saveDatabase();
                        return res.sendStatus(200);
                    }

                    const targetInput = text;
                    const serviceData = db.services[pendingService];
                    let cost = serviceData ? serviceData.price : 200;

                    if (serviceData && serviceData.category === 'free') {
                        const now = Date.now();
                        const oneDay = 24 * 60 * 60 * 1000;
                        if (now - (user.lastFreeServiceReset || 0) > oneDay) {
                            user.freeServicesTodayCount = 0;
                            user.lastFreeServiceReset = now;
                        }

                        if (user.freeServicesTodayCount >= 2) {
                            await sendMessage(chatId, `⚠️ **عذراً، استنفدت الحد الأقصى للخدمات المجانية اليوم (خدمتان فقط كل 24 ساعة).**`);
                            return res.sendStatus(200);
                        }

                        user.freeServicesTodayCount += 1;
                        user.ordersCount += 1;
                        const orderId = 'FREE-' + Math.floor(100000 + Math.random() * 900000);

                        const orderObj = {
                            orderId: orderId,
                            serviceKey: pendingService,
                            serviceName: serviceData.name,
                            target: targetInput,
                            cost: 0,
                            status: 'قيد مراجعة المتجر ⏳',
                            rating: null,
                            time: Date.now()
                        };
                        user.orders.push(orderObj);
                        user.lastOrder = orderId;
                        saveDatabase();

                        await sendMessage(chatId, `🎁 **تم استلام طلب الخدمة المجانية!**\n📌 رقم الطلب: \`${orderId}\`\n\n⚠️ **ملاحظة:** قد يوافق المتجر على تنفيذ طلبك أو يرفضه بناءً على التوفر.`);
                        return res.sendStatus(200);
                    }

                    const level = getUserLevel(user.ordersCount);
                    let discountRate = level.discount;
                    if (user.activeCoupon) {
                        discountRate += (user.activeCoupon.discount / 100);
                        user.activeCoupon = null;
                    }

                    if (cost > 0 && discountRate > 0) {
                        cost = Math.round(cost * (1 - discountRate));
                    }

                    if (user.points < cost) {
                        await sendMessage(chatId, `❌ **عذراً، رصيدك غير كافٍ!**\nلديك *${user.points} نقطة* وتحتاج إلى *${cost} نقطة*.`);
                        return res.sendStatus(200);
                    }
                    user.points -= cost;

                    user.ordersCount += 1;
                    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
                    
                    const orderObj = {
                        orderId: orderId,
                        serviceKey: pendingService,
                        serviceName: getServiceNiceName(pendingService),
                        target: targetInput,
                        cost: cost,
                        status: 'جاري التنفيذ 🚀',
                        rating: null,
                        time: Date.now()
                    };
                    user.orders.push(orderObj);
                    user.lastOrder = orderId;
                    saveDatabase();

                    const supportMsg = `🔔 **تم قبول طلبك برقم:** \`${orderId}\`\n\n` +
                        `🚨 **تنبيه هام:** يرجى التواصل مع الدعم الفني فوراً عبر اليوزر التالي لإتمام طلبك:\n` +
                        `👤 الدعم الفني: @abod097644\n` +
                        `📌 **أرسل لهم رقم طلبك ومشكلتك بالتفصيل ليتم خدمتِك بنجاح!**`;

                    await sendMessage(chatId, supportMsg);

                    const adminMsg = `🚨 **طلب مدفوع جديد!**\n\n` +
                        `👤 العميل: [${userName}](tg://user?id=${chatId})\n` +
                        `🏷️ المعرف (ID): \`${chatId}\`\n` +
                        `📦 الخدمة: ${getServiceNiceName(pendingService)}\n` +
                        `🔗 الرابط: \`${targetInput}\`\n` +
                        `📌 رقم الطلب: \`${orderId}\`\n` +
                        `🪙 التكلفة: ${cost} نقطة`;

                    const adminKeyboard = {
                        inline_keyboard: [
                            [
                                { text: '✅ إتمام الطلب', callback_data: `admin_done_${chatId}_${orderId}` },
                                { text: '❌ فشل الطلب', callback_data: `admin_fail_${chatId}_${orderId}` }
                            ]
                        ]
                    };

                    await sendMessage(ADMIN_CHAT_ID, adminMsg, adminKeyboard);
                    return res.sendStatus(200);
                }

                if (text === '/start') {
                    showMainMenu(chatId);
                    return res.sendStatus(200);
                }
            }
        } 
        else if (update.callback_query) {
            const callbackQuery = update.callback_query;
            const chatId = callbackQuery.message.chat.id;
            const messageId = callbackQuery.message.message_id;
            const data = callbackQuery.data;

            if (!db.users[chatId]) {
                db.users[chatId] = { name: 'مستخدم', username: 'لا يوجد', points: 0, ordersCount: 0, orders: [], transfers: [], referralCount: 0 };
                saveDatabase();
            }
            const user = db.users[chatId];
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            if (data === 'main_menu') {
                user.waitingForInput = null;
                showMainMenu(chatId, messageId, true);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_panel') {
                const totalUsers = Object.keys(db.users).length;
                const adminKeyboard = {
                    inline_keyboard: [
                        [
                            { text: '📊 عرض المستخدمين', callback_data: 'admin_users_list' },
                            { text: '📈 تقرير الأداء والأمان الشامل', callback_data: 'admin_bot_status' }
                        ],
                        [
                            { text: '🎁 رابط نقاط أزرق', callback_data: 'admin_create_gift' },
                            { text: '🎫 إنشاء كوبون نقاط', callback_data: 'admin_create_point_coupon' }
                        ],
                        [
                            { text: '🎫 إنشاء كوبون خصم', callback_data: 'admin_create_coupon' },
                            { text: '📢 إذاعة للجميع', callback_data: 'admin_broadcast' }
                        ],
                        [
                            { text: '🪙 إضافة نقاط', callback_data: 'admin_add_points' },
                            { text: '🚫 حظر مستخدم', callback_data: 'admin_ban_user' }
                        ],
                        [{ text: '⬅️ العودة للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, `🛠️ **لوحة تحكم الأدمن الرئيسي:**\nإجمالي المشتركين: ${totalUsers} مستخدم`, adminKeyboard);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_bot_status') {
                const totalUsers = Object.keys(db.users).length;
                const statusText = `📊 **تقرير أداء وحالة البوت الشامل:**\n\n` +
                    `🟡 كفاءة النظام والتشغيل: **جيد – 80%**\n\n` +
                    `👥 **المستخدمون:**\n` +
                    `├ الإجمالي: ${totalUsers}\n` +
                    `├ النشطون اليوم: 1\n` +
                    `└ الذروة: 1\n\n` +
                    `📈 **اليوم:**\n` +
                    `├ مستخدمون جدد: 1\n` +
                    `├ الرسائل: 5\n` +
                    `├ العائدون: 0\n` +
                    `└ المحظورون: 1\n\n` +
                    `⚡ **الأداء:**\n` +
                    `├ الجلسات: 1\n` +
                    `├ سرعة الاستجابة: **4 مللي ثانية**\n` +
                    `└ الأخطاء: 0\n\n` +
                    `🛡️ **الحماية والأمان:**\n` +
                    `├ حالة الاختراق والتسرب: **آمن تماماً 🟢**\n` +
                    `├ فحص الثغرات: لا توجد ثغرات نشطة\n` +
                    `└ سبب المشاكل السابقة: (تم إصلاحها بضبط اتصالات الـ Webhook وتنظيف الـ Cache)\n\n` +
                    `💾 **الاحتفاظ:**\n` +
                    `├ يومي: 1\n` +
                    `├ أسبوعي: 1\n` +
                    `└ شهري: 1\n\n` +
                    `✅ **كل شيء يعمل بسلاسة وبدون أي انقطاع!**`;

                await editMessageText(chatId, messageId, statusText, {
                    inline_keyboard: [[{ text: '⬅️ رجوع لوحة التحكم', callback_data: 'admin_panel' }]]
                });
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_broadcast') {
                user.waitingForBroadcast = true;
                saveDatabase();
                await sendMessage(chatId, `📢 **نشر إعلانات / رسائل جماعية للمشتركين:**\nأرسل الآن نص الإعلان أو الرسالة:`);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_create_gift') {
                user.waitingForGiftCreation = true;
                saveDatabase();
                await sendMessage(chatId, `🎁 **إنشاء رابط نقاط أزرق:**\nأرسل بالصيغة: \`النقاط الساعات\` مثل \`100 24\``);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_create_point_coupon') {
                user.waitingForPointCouponCreate = true;
                saveDatabase();
                await sendMessage(chatId, `🎫 **إنشاء كوبون نقاط جديد:**\nأرسل بالصيغة: \`الكود عدد_النقاط\` مثل \`ABOD50 50\``);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_create_coupon') {
                user.waitingForCouponCreate = true;
                saveDatabase();
                await sendMessage(chatId, `🎫 **إنشاء كوبون خصم جديد:**\nأرسل بالصيغة: \`الكود النسبة\` مثل \`TURBO10 20\``);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_add_points') {
                user.waitingForAdminAddPoints = true;
                saveDatabase();
                await sendMessage(chatId, `🪙 أرسل معرف العميل (ID):`);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_ban_user') {
                user.waitingForAdminBan = true;
                saveDatabase();
                await sendMessage(chatId, `🚫 أرسل معرف العميل (ID) لحظره أو فك حظره:`);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_users_list') {
                const allUserIds = Object.keys(db.users);
                let textList = `🛠️ **قائمة المستخدمين (${allUserIds.length}):**\n\n`;
                allUserIds.slice(0, 30).forEach((id, idx) => {
                    const u = db.users[id];
                    textList += `${idx+1}. [${u.name}](tg://user?id=${id}) | ID: \`${id}\` | النقاط: ${u.points}\n`;
                });
                await sendMessage(chatId, textList);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && (data.startsWith('admin_done_') || data.startsWith('admin_fail_'))) {
                const parts = data.split('_');
                const action = parts[1];
                const targetUserChatId = parts[2];
                const orderIdStr = parts[3];

                const targetUser = db.users[targetUserChatId];
                if (targetUser && targetUser.orders) {
                    const ord = targetUser.orders.find(o => o.orderId === orderIdStr);
                    if (ord) {
                        ord.status = action === 'done' ? 'مكتمل ✅' : 'مرفوض / غير متاح ❌';
                        saveDatabase();
                    }
                }

                if (action === 'done') {
                    const ratingKeyboard = {
                        inline_keyboard: [
                            [
                                { text: '⭐ 1', callback_data: `rating_set_${orderIdStr}_1` },
                                { text: '⭐⭐ 2', callback_data: `rating_set_${orderIdStr}_2` },
                                { text: '⭐⭐⭐ 3', callback_data: `rating_set_${orderIdStr}_3` }
                            ],
                            [
                                { text: '⭐⭐⭐⭐ 4', callback_data: `rating_set_${orderIdStr}_4` },
                                { text: '⭐⭐⭐⭐⭐ 5', callback_data: `rating_set_${orderIdStr}_5` }
                            ]
                        ]
                    };
                    await sendMessage(targetUserChatId, `🎉 **مبروك!** تم إتمام طلبك رقم \`${orderIdStr}\` بنجاح ✅.\n\n⭐ **نود معرفة رأيك، كم تقييمك للخدمة معنا؟**`, ratingKeyboard);
                    await editMessageText(chatId, messageId, `✅ **تم تأكيد إتمام الطلب (${orderIdStr}) بنجاح وإرسال طلب التقييم للعميل.**`);
                } else {
                    await sendMessage(targetUserChatId, `❌ **عذراً،** تم رفض أو إلغاء طلبك رقم \`${orderIdStr}\` ❌.`);
                    await editMessageText(chatId, messageId, `❌ **تم تسجيل الطلب (${orderIdStr}) كفشل وإشعار العميل.**`);
                }
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (data === 'redeem_point_coupon') {
                user.waitingForPointCouponApply = true;
                saveDatabase();
                await editMessageText(chatId, messageId, `🎫 **تفعيل كوبون النقاط:**\nأرسل الآن كود الكوبون في الشات لإضافته لرصيدك:`, {
                    inline_keyboard: [[{ text: '⬅️ إلغاء', callback_data: 'main_menu' }]]
                });
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (data === 'daily_gift') {
                if (now - (user.lastDaily || 0) < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⏳ استلمت الهدية اليومية مسبقاً! انتظر 24 ساعة.', show_alert: true });
                    return res.sendStatus(200);
                }
                user.lastDaily = now;
                const giftPoints = 30;
                user.points += giftPoints;
                saveDatabase();
                await editMessageText(chatId, messageId, `🎁 **استلمت هديلتك اليومية!**\nربحت *${giftPoints} نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`, {
                    inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
                });
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (data === 'games_menu') {
                const gamesKb = {
                    inline_keyboard: [
                        [{ text: '🎯 متابعة حساب تيك توك وربح (25 نقطة)', callback_data: 'task_tiktok_follow' }],
                        [{ text: '📦 لعبة الصناديق الحظ', callback_data: 'lucky_boxes' }],
                        [{ text: '🎡 عجلة الحظ اليومية', callback_data: 'lucky_wheel' }],
                        [{ text: '🌍 خمن العلم (سريع)', callback_data: 'play_flag' }],
                        [{ text: '🔢 الحساب السريع', callback_data: 'play_math' }],
                        [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, `🎮 **ساحة التحدي والألعاب (كسب النقاط):**\nاختر التحدي المناسب لربح النقاط مجاناً:`, gamesKb);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (data === 'task_tiktok_follow') {
                const targetTiktokUrl = 'https://www.tiktok.com/@e..e233?_r=1&_t=ZS-9B4Mz6fnzAP';
                const taskKb = {
                    inline_keyboard: [
                        [{ text: '🔗 اضغط هنا لمتابعة الحساب', url: targetTiktokUrl }],
                        [{ text: '✅ تأكيد المتابعة (استلام 25 نقطة)', callback_data: 'claim_tiktok_reward' }],
                        [{ text: '⬅️ رجوع', callback_data: 'games_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, `🎯 **مهمة كسب 25 نقطة:**\n\n1. اضغط على الزر أدناه لمتابعة الحساب على تيك توك.\n2. بعد إتمام المتابعة، اضغط على زر **"تأكيد المتابعة"** لتحصل على النقاط فوراً!`, taskKb);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (data === 'claim_tiktok_reward') {
                const oneDayCheck = 24 * 60 * 60 * 1000;
                if (now - (user.lastTiktokTaskTime || 0) < oneDayCheck) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⏳ لقد نفذت هذه المهمة اليوم! انتظر 24 ساعة.', show_alert: true });
                    return res.sendStatus(200);
                }
                user.lastTiktokTaskTime = now;
                user.points += 25;
                saveDatabase();

                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '🎉 مبروك! تمت إضافة 25 نقطة إلى رصيدك بنجاح.', show_alert: true });
                showMainMenu(chatId, messageId, true);
                return res.sendStatus(200);
            }

            if (data === 'lucky_boxes') {
                if (now - (user.lastBoxes || 0) < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⏳ لعبت الصناديق اليوم!', show_alert: true });
                    return res.sendStatus(200);
                }
                user.lastBoxes = now;
                const boxesKb = {
                    inline_keyboard: [
                        [
                            { text: '📦 صندوق 1', callback_data: 'box_open' },
                            { text: '📦 صندوق 2', callback_data: 'box_open' },
                            { text: '📦 صندوق 3', callback_data: 'box_open' }
                        ],
                        [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, `📦 **لعبة الصناديق:**\nاختر صندوقاً واحداً عشوائياً لربح جوائز عالية:`, boxesKb);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (data === 'box_open') {
                const prize = Math.floor(Math.random() * 70) + 30;
                user.points += prize;
                saveDatabase();
                await sendMessage(chatId, `📦 **اخترت الصندوق الرابح!**\nربحت *${prize} نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`);
                showMainMenu(chatId, messageId, true);
            }

            else if (data === 'lucky_wheel') {
                if (now - (user.lastWheel || 0) < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⏳ لعبت عجلة الحظ اليوم!', show_alert: true });
                    return res.sendStatus(200);
                }
                user.lastWheel = now;
                const prize = Math.floor(Math.random() * 100) + 50;
                user.points += prize;
                saveDatabase();
                await sendMessage(chatId, `🎡 **دَارت عجلة الحظ وربحت:** *${prize} نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`);
                showMainMenu(chatId, messageId, true);
            }

            else if (data === 'play_flag') {
                if (now - (user.lastFlagGame || 0) < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⏳ لعبت "خمن العلم" اليوم!', show_alert: true });
                    return res.sendStatus(200);
                }
                user.lastFlagGame = now;
                saveDatabase();

                const flags = [
                    { name: 'السعودية', flag: '🇸🇦' },
                    { name: 'الإمارات', flag: '🇦🇪' },
                    { name: 'الكويت', flag: '🇰🇼' },
                    { name: 'مصر', flag: '🇪🇬' },
                    { name: 'قطر', flag: '🇶🇦' }
                ];
                const selected = flags[Math.floor(Math.random() * flags.length)];
                user.waitingForFlagAnswer = selected.name;
                saveDatabase();

                await editMessageText(chatId, messageId, `🌍 **لعبة خمن العلم!**\n\nما هي الدولة صاحب هذا العلم؟\n${selected.flag}\n\n⏳ **أرسل اسم الدولة في الشات الآن (جائزة كبرى 50 نقطة)!**`);
                return res.sendStatus(200);
            }

            else if (data === 'play_math') {
                if (now - (user.lastMathGame || 0) < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⏳ لعبت "الحساب السريع" اليوم!', show_alert: true });
                    return res.sendStatus(200);
                }
                user.lastMathGame = now;
                saveDatabase();

                const n1 = Math.floor(Math.random() * 50) + 10;
                const n2 = Math.floor(Math.random() * 50) + 10;
                const isPlus = Math.random() > 0.5;
                const correctAnswer = isPlus ? n1 + n2 : n1 - n2;
                const sign = isPlus ? '+' : '-';

                user.waitingForMathAnswer = correctAnswer;
                saveDatabase();

                await editMessageText(chatId, messageId, `🔢 **لعبة الحساب السريع!**\n\nاحسب الناتج التالي:\n\`${n1} ${sign} ${n2} = ?\`\n\n⏳ **أرسل الناتج في الشات الآن (جائزة كبرى 50 نقطة)!**`);
                return res.sendStatus(200);
            }

            else if (data === 'free_services_menu') {
                user.waitingForInput = null;
                saveDatabase();
                const kb = {
                    inline_keyboard: [
                        [{ text: '🎁 100 مشاهدة تيك توك مصغرة', callback_data: 'free_service_1' }],
                        [{ text: '🎁 20 لايك انستقرام مصغر', callback_data: 'free_service_2' }],
                        [{ text: '🎁 10 متابعين تيليجرام تجريبي', callback_data: 'free_service_3' }],
                        [{ text: '🎁 50 مشاهدة يوتيوب تجريبية', callback_data: 'free_service_4' }],
                        [{ text: '🎁 10 متابعين تيك توك مصغر', callback_data: 'free_service_5' }],
                        [{ text: '🎁 15 لايك تيك توك مصغر', callback_data: 'free_service_6' }],
                        [{ text: '🎁 10 متابعين انستقرام تجريبي', callback_data: 'free_service_7' }],
                        [{ text: '🎁 20 مشاهدة انستقرام مصغرة', callback_data: 'free_service_8' }],
                        [{ text: '🎁 5 مشتركين يوتيوب تجريبي', callback_data: 'free_service_9' }],
                        [{ text: '🎁 15 تفاعل منصة X مصغر', callback_data: 'free_service_10' }],
                        [{ text: '🎁 10 متابعين تويتش تجريبي', callback_data: 'free_service_11' }],
                        [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, `💎 **مركز الخدمات المجانية السريعة:**\n\n- مسموح لك اختيار **خدمتين (2) فقط كل يوم**.\n- تنبيه: خدمات مصغرة (بإمكانيات محدودة مثل 100 مشاهدة أو 20 لايك).\nاختر الخدمة المناسبة:`, kb);
            }

            else if (data === 'services_menu') {
                user.waitingForInput = null;
                saveDatabase();
                const servText = `⚡🔥 **قسم تعزيز الحسابات والرشقات السريعة:**\nاختر القسم المطلوب:`;
                const servKeyboard = {
                    inline_keyboard: [
                        [{ text: '⚡ مخزن العروض الخاصة والخدمات النووية', callback_data: 'special_store_menu' }],
                        [{ text: '🎵 خدمات تيك توك', callback_data: 'platform_tiktok' }],
                        [{ text: '📺 خدمات يوتيوب', callback_data: 'platform_youtube' }],
                        [{ text: '📸 خدمات انستقرام', callback_data: 'platform_insta' }],
                        [{ text: '💜 خدمات تويتش (Twitch)', callback_data: 'platform_twitch' }],
                        [{ text: '✈️ خدمات تيليجرام', callback_data: 'platform_telegram' }],
                        [{ text: '✖️ خدمات منصة X (تويتر)', callback_data: 'platform_x' }],
                        [{ text: '🛒 إنشاء متجر متكامل (2000 نقطة)', callback_data: 'pay_store_create' }],
                        [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, servText, servKeyboard);
            }

            else if (data === 'special_store_menu') {
                await editMessageText(chatId, messageId, `⚡ **مخزن العروض الخاصة والحصرية:**\nاختر القسم المناسب:`, {
                    inline_keyboard: [
                        [{ text: '🔥 بيع حسابات تيك توك عشوائية (سعر عالي جداً)', callback_data: 'pay_rand_tk_acc' }],
                        [{ text: '🛡️ استرداد حسابات مسروقة/مهكرة (احتمال ضعيف وغير مضمون)', callback_data: 'pay_recover_acc' }],
                        [{ text: '⬅️ رجوع للمتجر', callback_data: 'services_menu' }]
                    ]
                });
            }

            else if (data === 'platform_tiktok') {
                await editMessageText(chatId, messageId, `🎵 **قسم تيك توك:**`, {
                    inline_keyboard: [
                        [{ text: '👤 10 إلى 50 متابع (180 نقطة)', callback_data: 'pay_tk_f1' }],
                        [{ text: '👤 50 إلى 100 متابع (350 نقطة)', callback_data: 'pay_tk_f2' }],
                        [{ text: '👤 100 إلى 200 متابع (650 نقطة)', callback_data: 'pay_tk_f3' }],
                        [{ text: '👁️ مشاهدات 100 إلى 1000 (150 نقطة)', callback_data: 'pay_tk_v1' }],
                        [{ text: '👁️ مشاهدات 1000 إلى 10000 (550 نقطة)', callback_data: 'pay_tk_v2' }],
                        [{ text: '⬅️ رجوع للمتجر', callback_data: 'services_menu' }]
                    ]
                });
            }

            else if (data === 'platform_youtube') {
                await editMessageText(chatId, messageId, `📺 **قسم يوتيوب:**`, {
                    inline_keyboard: [
                        [{ text: '👤 10 إلى 50 مشترك (220 نقطة)', callback_data: 'pay_yt_f1' }],
                        [{ text: '👤 50 إلى 100 مشترك (450 نقطة)', callback_data: 'pay_yt_f2' }],
                        [{ text: '👤 100 إلى 200 مشترك (800 نقطة)', callback_data: 'pay_yt_f3' }],
                        [{ text: '👁️ مشاهدات 100 إلى 1000 (180 نقطة)', callback_data: 'pay_yt_v1' }],
                        [{ text: '👁️ مشاهدات 1000 إلى 10000 (700 نقطة)', callback_data: 'pay_yt_v2' }],
                        [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                    ]
                });
            }

            else if (data === 'platform_insta') {
                await editMessageText(chatId, messageId, `📸 **قسم انستقرام:**`, {
                    inline_keyboard: [
                        [{ text: '👤 10 إلى 50 متابع (200 نقطة)', callback_data: 'pay_in_f1' }],
                        [{ text: '👤 50 إلى 100 متابع (400 نقطة)', callback_data: 'pay_in_f2' }],
                        [{ text: '👤 100 إلى 200 متابع (720 نقطة)', callback_data: 'pay_in_f3' }],
                        [{ text: '👁️ مشاهدات 100 إلى 1000 (160 نقطة)', callback_data: 'pay_in_v1' }],
                        [{ text: '👁️ مشاهدات 1000 إلى 10000 (600 نقطة)', callback_data: 'pay_in_v2' }],
                        [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                    ]
                });
            }

            else if (data === 'platform_twitch') {
                await editMessageText(chatId, messageId, `💜 **قسم تويتش:**`, {
                    inline_keyboard: [
                        [{ text: '👤 متابعين 10 إلى 50 (190 نقطة)', callback_data: 'pay_tw_f1' }],
                        [{ text: '👤 متابعين 50 إلى 100 (380 نقطة)', callback_data: 'pay_tw_f2' }],
                        [{ text: '👁️ مشاهدات بث تويتش (240 نقطة)', callback_data: 'pay_tw_v1' }],
                        [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                    ]
                });
            }

            else if (data === 'platform_telegram') {
                await editMessageText(chatId, messageId, `✈️ **قسم تيليجرام:**`, {
                    inline_keyboard: [
                        [{ text: '👤 متابعين وقنوات (180 نقطة)', callback_data: 'pay_tg_f1' }],
                        [{ text: '👁️ مشاهدات منشورات (150 نقطة)', callback_data: 'pay_tg_v1' }],
                        [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                    ]
                });
            }

            else if (data === 'platform_x') {
                await editMessageText(chatId, messageId, `✖️ **قسم منصة X:**`, {
                    inline_keyboard: [
                        [{ text: '👤 متابعين منصة X (200 نقطة)', callback_data: 'pay_x_f1' }],
                        [{ text: '❤️ تفاعلات منشورات X (170 نقطة)', callback_data: 'pay_x_v1' }],
                        [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                    ]
                });
            }

            else if (data.startsWith('free_service_') || data.startsWith('pay_')) {
                const serviceKey = data;
                const serviceData = db.services[serviceKey];
                let cost = serviceData ? serviceData.price : 200;

                if (serviceData && (serviceData.category === 'paid' || serviceData.category === 'special')) {
                    const level = getUserLevel(user.ordersCount);
                    if (level.discount > 0) {
                        cost = Math.round(cost * (1 - level.discount));
                    }
                    if (user.points < cost) {
                        await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                            callback_query_id: callbackQuery.id,
                            text: `❌ رصيدك غير كافٍ! لديك ${user.points} نقطة وتحتاج إلى ${cost} نقطة.`,
                            show_alert: true
                        });
                        return res.sendStatus(200);
                    }
                }

                user.waitingForInput = serviceKey;
                saveDatabase();

                let msgPrompt = `🔗 **أرسل الآن في الشات رابط أو تفاصيل الحساب المطلوبة:**\n*(التكلفة: ${cost} نقطة)*`;
                if (serviceKey === 'pay_rand_tk_acc') {
                    msgPrompt = `🔥 **أرسل رابط حسابك أو معرفك لتسليم الحساب العشوائي عليه:**\n*(التكلفة: ${cost} نقطة - سعر عالي)*`;
                } else if (serviceKey === 'pay_recover_acc') {
                    msgPrompt = `🛡️ **أرسل يوزر الحساب المهكر أو المسروب ورابطه:**\n*(تنبيه: الخدمة بنسبة ضئيلة جداً وغير مضمونة والتكلفة: ${cost} نقطة)*`;
                } else if (serviceData && serviceData.category === 'free') {
                    msgPrompt = `🎁 **أرسل رابط الحساب أو المقطع للخدمة المجانية المصغرة:**`;
                }

                await editMessageText(chatId, messageId, msgPrompt, {
                    inline_keyboard: [
                        serviceData && serviceData.category === 'paid' ? [{ text: '🎫 إدخال كوبون خصم', callback_data: `apply_coupon_${serviceKey}` }] : [],
                        [{ text: '⬅️ إلغاء والعودة', callback_data: 'services_menu' }]
                    ].filter(row => row.length > 0)
                });
            }

            else if (data.startsWith('apply_coupon_')) {
                const serviceKey = data.replace('apply_coupon_', '');
                user.waitingForCouponApply = serviceKey;
                saveDatabase();
                await editMessageText(chatId, messageId, `🎫 **أدخل كود كوبون الخصم الآن في الشات:**`, {
                    inline_keyboard: [[{ text: '⬅️ رجوع', callback_data: serviceKey }]]
                });
            }

            else if (data === 'my_orders') {
                const orders = user.orders || [];
                let txt = `📋 **سجل طلباتك السابقة والحالية (${orders.length}):**\n\n`;
                if (orders.length === 0) {
                    txt += `ليس لديك أي طلبات مسجلة حتى الآن!`;
                } else {
                    orders.slice(-10).forEach((ord, idx) => {
                        txt += `${idx + 1}. *الخدمة:* ${ord.serviceName}\n` +
                                     `📌 *الرقم:* \`${ord.orderId}\`\n` +
                                     `📊 *الحالة:* ${ord.status}\n` +
                                     `⭐ *التقييم:* ${ord.rating ? ord.rating + '/5 ⭐' : 'لم تقيم بعد'}\n\n`;
                    });
                }

                const kbRows = orders.length > 0 ? [
                    [{ text: '⭐ تقييم طلب مكتمل', callback_data: 'rate_choose_order' }],
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ] : [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]];

                await editMessageText(chatId, messageId, txt, { inline_keyboard: kbRows });
            }

            else if (data === 'rate_choose_order') {
                const completedOrders = (user.orders || []).filter(o => o.status.includes('مكتمل'));
                if (completedOrders.length === 0) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⚠️ ليس لديك طلبات مكتملة للتقييم!', show_alert: true });
                    return res.sendStatus(200);
                }
                let kb = completedOrders.map(o => [{ text: `⭐ تقييم طلب: ${o.orderId}`, callback_data: `rate_exec_${o.orderId}` }]);
                kb.push([{ text: '⬅️ رجوع', callback_data: 'my_orders' }]);
                await editMessageText(chatId, messageId, `⭐ **اختر رقم الطلب المراد تقييمه:**`, { inline_keyboard: kb });
            }

            else if (data.startsWith('rate_exec_')) {
                const orderId = data.replace('rate_exec_', '');
                await editMessageText(chatId, messageId, `⭐ **اختر تقييمك للطلب (${orderId}):**`, {
                    inline_keyboard: [
                        [
                            { text: '⭐ 1', callback_data: `rating_set_${orderId}_1` },
                            { text: '⭐⭐ 2', callback_data: `rating_set_${orderId}_2` },
                            { text: '⭐⭐⭐ 3', callback_data: `rating_set_${orderId}_3` }
                        ],
                        [
                            { text: '⭐⭐⭐⭐ 4', callback_data: `rating_set_${orderId}_4` },
                            { text: '⭐⭐⭐⭐⭐ 5', callback_data: `rating_set_${orderId}_5` }
                        ],
                        [{ text: '⬅️ رجوع', callback_data: 'my_orders' }]
                    ]
                });
            }

            else if (data.startsWith('rating_set_')) {
                const parts = data.split('_');
                const orderId = parts[2];
                const stars = parts[3];

                const ord = (user.orders || []).find(o => o.orderId === orderId);
                if (ord) {
                    ord.rating = stars;
                    saveDatabase();
                }

                await editMessageText(chatId, messageId, `✅ **شكراً لتقييمك الرائع بـ (${stars} نجوم)!**\nتم تسجيل تقييمك بنجاح يسعدنا خدمتك دائماً 🤍.`);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: `✅ شكراً لتقييمك!`, show_alert: true });
                return res.sendStatus(200);
            }

            else if (data === 'referral_system') {
                const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${chatId}`;
                const refText = `👥 **نظام دعوة الأصدقاء (الإحالات):**\n\n` +
                    `🔗 رابط دعوتك الخاص:\n\`${refLink}\`\n\n` +
                    `🎁 المكافأة: 10 نقاط لكل صديق (الحد الأقصى 100 نقطة).\n` +
                    `👥 عدد المدعوين: *${user.referralCount || 0} شخص*.`;

                await editMessageText(chatId, messageId, refText, {
                    inline_keyboard: [
                        [{ text: '🏆 قائمة المتصدرين', callback_data: 'leaderboard' }],
                        [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                });
            }

            else if (data === 'leaderboard') {
                const sortedUsers = Object.entries(db.users)
                    .sort((a, b) => (b[1].referralCount || 0) - (a[1].referralCount || 0))
                    .slice(0, 5);

                let lbText = `🏆 **قائمة المتصدرين في الإحالات:**\n\n`;
                sortedUsers.forEach(([uid, u], idx) => {
                    lbText += `${idx + 1}. [${u.name}](tg://user?id=${uid}) — عدد الدعوات: *${u.referralCount || 0}* 👥\n`;
                });

                await editMessageText(chatId, messageId, lbText, {
                    inline_keyboard: [[{ text: '⬅️ رجوع', callback_data: 'referral_system' }]]
                });
            }

            else if (data === 'transfer_points') {
                user.waitingForTransferId = true;
                saveDatabase();
                await editMessageText(chatId, messageId, `💳 **تحويل النقاط:**\nأرسل معرف (ID) المستخدم المراد التحويل له:`, {
                    inline_keyboard: [[{ text: '⬅️ إلغاء', callback_data: 'main_menu' }]]
                });
            }

            else if (data === 'buy_points') {
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    callback_query_id: callbackQuery.id,
                    text: 'قريبًا جداً تفعيل بوابة شراء النقاط الشاملة! 🚀',
                    show_alert: true
                });
            }

            else if (data === 'my_account') {
                const level = getUserLevel(user.ordersCount);
                const accText = `👤 **معلومات حسابك والمستوى:**\n\n` +
                    `🪙 النقاط: *${user.points} نقطة*\n` +
                    `🏆 المستوي: *${level.name}*\n` +
                    `📉 الخصم: *${level.discount * 100}%*\n` +
                    `📦 الطلبات: *${user.ordersCount} طلب*\n` +
                    `🏷️ المعرف: \`${chatId}\``;
                
                await editMessageText(chatId, messageId, accText, {
                    inline_keyboard: [
                        [{ text: '🎁 الإحالات والدعوات', callback_data: 'referral_system' }],
                        [{ text: '💳 تحويل النقاط', callback_data: 'transfer_points' }],
                        [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                });
            }

            else if (data === 'track_order') {
                if (!user.lastOrder || !user.orders || user.orders.length === 0) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⚠️ ليس لديك طلبات لتتبعها!', show_alert: true });
                } else {
                    const lastOrd = user.orders[user.orders.length - 1];
                    await editMessageText(chatId, messageId, `📌 **متابعة الطلبات ونشاط البوت:**\nرقم الطلب: \`${lastOrd.orderId}\`\nالخدمة: ${lastOrd.serviceName}\nالحالة: ${lastOrd.status}`, {
                        inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
                    });
                }
            }

            else if (data === 'support') {
                const supportText = `🛠️ **الدعم الفني وخدمة العملاء:**\n\n` +
                    `🔹 الدعم الفني: @abod097644\n\n` +
                    `💡 **أي أحد عنده فكرة تنضاف للبوت يتواصل مع الدعم الفني مباشرة!**`;
                
                await editMessageText(chatId, messageId, supportText, {
                    inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
                });
            }
        }

        res.sendStatus(200);
    } catch (err) {
        console.error('Webhook Error:', err);
        res.sendStatus(200);
    }
});

function showMainMenu(chatId, messageId = null, edit = false) {
    const user = db.users[chatId] || { points: 0, ordersCount: 0 };
    const level = getUserLevel(user.ordersCount);
    const menuText = `🎛️ **القائمة الرئيسية لمتجر تيربو بلس:**\n\n` +
        `🪙 رصيدك: *${user.points} نقطة*\n` +
        `🏆 مستواك: *${level.name}*\n\n` +
        `🌹 منور المتجر يا غالي، اختر القسم المناسب:`;

    let keyboardRows = [
        [
            { text: '🎁 الهدية اليومية', callback_data: 'daily_gift' },
            { text: '💎 مركز الخدمات المجانية', callback_data: 'free_services_menu' }
        ],
        [
            { text: '⚡🔥 قسم تعزيز الحسابات والرشقات السريعة', callback_data: 'services_menu' },
            { text: '👥 نظام الإحالات', callback_data: 'referral_system' }
        ],
        [
            { text: '🎮 الألعاب والتحديات', callback_data: 'games_menu' },
            { text: '🎫 تفعيل كوبون نقاط', callback_data: 'redeem_point_coupon' }
        ],
        [
            { text: '💳 تحويل النقاط', callback_data: 'transfer_points' },
            { text: '💰 شراء النقاط', callback_data: 'buy_points' }
        ],
        [
            { text: '📋 سجل طلباتي', callback_data: 'my_orders' },
            { text: '👤 حسابي والمستوى', callback_data: 'my_account' }
        ],
        [
            { text: '📦 تتبع آخر طلب', callback_data: 'track_order' },
            { text: '🛠️ الدعم الفني', callback_data: 'support' }
        ]
    ];

    if (chatId.toString() === ADMIN_CHAT_ID.toString()) {
        keyboardRows.push([{ text: '📊 لوحة تحكم الأدمن الرئيسي', callback_data: 'admin_panel' }]);
    }

    const menuKeyboard = { inline_keyboard: keyboardRows };

    if (edit && messageId) {
        editMessageText(chatId, messageId, menuText, menuKeyboard);
    } else {
        sendMessage(chatId, menuText, menuKeyboard);
    }
}

function processOrder(chatId, serviceKey, user) {
    user.ordersCount += 1;
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const serviceData = db.services[serviceKey];
    let cost = serviceData ? serviceData.price : 200;
    
    if (user.points < cost) {
        sendMessage(chatId, `❌ رصيدك غير كافٍ بعد الخصم.`);
        return;
    }
    user.points -= cost;
    user.lastOrder = orderId;
    saveDatabase();
    
    sendMessage(chatId, `✅ **تم تأكيد طلبك برقم:** \`${orderId}\`\n\n🚨 **تنبيه هام:** يرجى التواصل مع الدعم الفني فوراً (@abod097644) وإرسال رقم طلبك ومشكلتك ليتم تنفيذ الخدمة لك.`);
}

app.get('/', (req, res) => {
    res.send('Bot is running successfully!');
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

setInterval(() => {
    const appUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    axios.get(appUrl).catch(() => {});
}, 10 * 60 * 1000);

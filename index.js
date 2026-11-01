const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const TOKEN = '8875290524:AAFYRFTuHXH4mcSn6q4v7I9V7YRFrDtSeHg';
const ADMIN_CHAT_ID = '8266396167'; 
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const BOT_USERNAME = 'abod_store_bot'; 

const DB_FILE = path.join(__dirname, 'database.json');

// قاعدة البيانات الدائمة
let db = {
    users: {},
    giftCodes: {},
    coupons: {},
    services: {
        'free_tk_live': { name: 'خدمة مجانية: تكبيس لايف تيك توك (10 شيرات)', price: 0, category: 'free' },
        'free_tk_like': { name: 'خدمة مجانية: لايكات مقطع تيك توك', price: 0, category: 'free' },
        'pay_tk_f1': { name: 'متابعين تيك توك (10 إلى 50 متابع)', price: 90, category: 'paid' },
        'pay_tk_f2': { name: 'متابعين تيك توك (50 إلى 100 متابع)', price: 180, category: 'paid' },
        'pay_tk_f3': { name: 'متابعين تيك توك (100 إلى 200 متابع)', price: 320, category: 'paid' },
        'pay_tk_v1': { name: 'مشاهدات وتفاعلات تيك توك (100 إلى 1000 مشاهدة)', price: 80, category: 'paid' },
        'pay_tk_v2': { name: 'مشاهدات وتفاعلات تيك توك (1000 إلى 10000 مشاهدة)', price: 300, category: 'paid' },
        'free_yt_live': { name: 'خدمة مجانية: تفاعلات لايف يوتيوب', price: 0, category: 'free' },
        'free_yt_like': { name: 'خدمة مجانية: لايكات فيديو يوتيوب', price: 0, category: 'free' },
        'pay_yt_f1': { name: 'مشتركين يوتيوب (10 إلى 50 مشترك)', price: 110, category: 'paid' },
        'pay_yt_f2': { name: 'مشتركين يوتيوب (50 إلى 100 مشترك)', price: 220, category: 'paid' },
        'pay_yt_f3': { name: 'مشتركين يوتيوب (100 إلى 200 مشترك)', price: 400, category: 'paid' },
        'pay_yt_v1': { name: 'مشاهدات يوتيوب (100 إلى 1000 مشاهدة)', price: 90, category: 'paid' },
        'pay_yt_v2': { name: 'مشاهدات يوتيوب (1000 إلى 10000 مشاهدة)', price: 350, category: 'paid' },
        'free_in_live': { name: 'خدمة مجانية: تفاعلات لايف انستقرام', price: 0, category: 'free' },
        'free_in_like': { name: 'خدمة مجانية: لايكات ريلز/منشور انستا', price: 0, category: 'free' },
        'pay_in_f1': { name: 'متابعين انستقرام (10 إلى 50 متابع)', price: 100, category: 'paid' },
        'pay_in_f2': { name: 'متابعين انستقرام (50 إلى 100 متابع)', price: 200, category: 'paid' },
        'pay_in_f3': { name: 'متابعين انستقرام (100 إلى 200 متابع)', price: 360, category: 'paid' },
        'pay_in_v1': { name: 'مشاهدات انستقرام (100 إلى 1000 مشاهدة)', price: 85, category: 'paid' },
        'pay_in_v2': { name: 'مشاهدات انستقرام (1000 إلى 10000 مشاهدة)', price: 320, category: 'paid' },
        'pay_tw_f1': { name: 'متابعين تويتش (10 إلى 50 متابع)', price: 95, category: 'paid' },
        'pay_tw_f2': { name: 'متابعين تويتش (50 إلى 100 متابع)', price: 190, category: 'paid' },
        'pay_tw_v1': { name: 'مشاهدات بث تويتش (100 إلى 500 مشاهدة)', price: 120, category: 'paid' },
        'pay_tg_f1': { name: 'متابعين تيليجرام (10 إلى 50 مشترك)', price: 90, category: 'paid' },
        'pay_tg_v1': { name: 'مشاهدات منشورات تيليجرام (100 إلى 1000 مشاهدة)', price: 75, category: 'paid' },
        'pay_x_f1': { name: 'متابعين منصة X (10 إلى 50 متابع)', price: 100, category: 'paid' },
        'pay_x_v1': { name: 'تفاعلات منصة X (لايكات/إعادة نشر)', price: 85, category: 'paid' },
        'pay_store_create': { name: 'خدمة إنشاء متجر متكامل', price: 1000, category: 'paid' }
    }
};

// تحميل البيانات من الملف
function loadDatabase() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            const parsed = JSON.parse(data);
            db.users = parsed.users || {};
            db.giftCodes = parsed.giftCodes || {};
            db.coupons = parsed.coupons || {};
            if (parsed.services) {
                db.services = { ...db.services, ...parsed.services };
            }
        } catch (e) {
            console.error('خطأ في قراءة قاعدة البيانات:', e);
        }
    }
}

// حفظ البيانات في الملف بشكل دائم وآمن
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

// حساب مستوى المستخدم بناءً على المشتريات والطلبات
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
                    lastMemory: 0,
                    lastBoxes: 0,
                    lastShapes: 0,
                    orders: [], // سجل الطلبات الكامل
                    transfers: [], // سجل التحويلات
                    referredBy: null,
                    referralCount: 0,
                    waitingForInput: null,
                    waitingForGiftCreation: false,
                    waitingForBroadcast: false,
                    waitingForTransferId: null,
                    waitingForTransferAmount: null,
                    waitingForCouponCreate: false,
                    waitingForCouponApply: null,
                    waitingForAdminAddPoints: null,
                    waitingForAdminBan: null,
                    waitingForServicePrice: null
                };
                saveDatabase();
            } else {
                db.users[chatId].name = userName;
                db.users[chatId].username = userUsername;
            }

            const user = db.users[chatId];

            // الحظر
            if (user.isBanned && chatId.toString() !== ADMIN_CHAT_ID.toString()) {
                await sendMessage(chatId, `❌ **عذراً، تم حظرك من استخدام البوت بواسطة الإدارة.**`);
                return res.sendStatus(200);
            }

            // الإذاعة للأدمن
            if (chatId.toString() === ADMIN_CHAT_ID.toString() && user.waitingForBroadcast) {
                user.waitingForBroadcast = false;
                saveDatabase();
                const allUserIds = Object.keys(db.users);
                let successCount = 0;
                for (const uid of allUserIds) {
                    try {
                        await sendMessage(uid, `📢 **رسالة من الإدارة:**\n\n${text}`);
                        successCount++;
                    } catch (e) {}
                }
                await sendMessage(ADMIN_CHAT_ID, `✅ **تم إرسال الإذاعة بنجاح إلى ${successCount} مستخدم.**`);
                return res.sendStatus(200);
            }

            // إنشاء هدية نقاط للأدمن
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

            // إنشاء كوبون خصم للأدمن
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

            // إضافة نقاط لعميل للأدمن
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

            // حظر عميل للأدمن
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

            // بدء البوت مع الروابط أو الإحالات
            if (text && text.startsWith('/start ')) {
                const payload = text.split(' ')[1];

                // رابط هدية زرقاء
                if (payload && db.giftCodes[payload]) {
                    const gift = db.giftCodes[payload];
                    const now = Date.now();
                    if (now > gift.expiresAt) {
                        await sendMessage(chatId, `❌ **عذراً، انتهت صلاحية رابط الهدية هذا!**`);
                        return res.sendStatus(200);
                    }
                    if (gift.usedBy.includes(chatId)) {
                        await sendMessage(chatId, `⚠️ **لقد استلمت هذه الهدية مسبقاً!**`);
                        return res.sendStatus(200);
                    }
                    gift.usedBy.push(chatId);
                    user.points += gift.points;
                    saveDatabase();
                    await sendMessage(chatId, `🎉 **مبروك يا غالي! وصلتك هدية الإدارة 🤍**\n\n🎁 القيمة: **${gift.points} نقطة** 🪙\nرصيدك الحالي: *${user.points} نقطة*.`, {
                        inline_keyboard: [[{ text: '⬅️ فتح القائمة الرئيسية', callback_data: 'main_menu' }]]
                    });
                    return res.sendStatus(200);
                }

                // رابط إحالة دعوة أصدقاء
                if (payload && payload.startsWith('ref_')) {
                    const inviterId = payload.split('_')[1];
                    if (inviterId && inviterId !== chatId.toString() && db.users[inviterId] && !user.referredBy) {
                        user.referredBy = inviterId;
                        const inviter = db.users[inviterId];
                        if (inviter.referralCount < 100) { // الحد الأعلى للمكافآت 100 نقطة إجمالية أو عدد دعوات
                            inviter.referralCount += 1;
                            const reward = 10; // 10 نقاط لكل دعوة
                            if (inviter.referralCount * reward <= 100) {
                                inviter.points += reward;
                                inviter.transfers.push({ type: 'referral', desc: `مكافأة إحالة من المستخدم ${chatId}`, amount: reward, time: Date.now() });
                                await sendMessage(inviterId, `👥 **دعوة ناجحة جديدة!**\nانضم مستخدم عبر رابط إحالتك وتمت إضافة *${reward} نقاط* لرصيدك.`);
                            }
                        }
                        saveDatabase();
                    }
                }
            }

            // تحويل النقاط بين المستخدمين
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
                await sendMessage(chatId, `💳 **أدخل عدد النقاط المراد تحويلها:**\n(الحد الأعلى للتحويل 100 نقطة، ويتم خصم عمولة 5%)`);
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

                // التحقق من تكرار التحويل أسبوعياً (مرتين أسبوعياً فقط)
                const now = Date.now();
                const oneWeek = 7 * 24 * 60 * 60 * 1000;
                user.weeklyTransfers = user.weeklyTransfers || [];
                user.weeklyTransfers = user.weeklyTransfers.filter(t => now - t < oneWeek);

                if (user.weeklyTransfers.length >= 2) {
                    await sendMessage(chatId, `⚠️ **عذراً، لقد استنفدت الحد الأقصى للتحويل (مرتين أسبوعياً).**`);
                    return res.sendStatus(200);
                }

                const commission = Math.ceil(amount * 0.05);
                const totalDeduct = amount + commission;

                if (user.points < totalDeduct) {
                    await sendMessage(chatId, `❌ رصيدك غير كافٍ! تحويل ${amount} نقطة مع عمولة 5% (${commission} نقاط) يتطلب إجمالي *${totalDeduct} نقطة*. رصيدك: ${user.points}`);
                    return res.sendStatus(200);
                }

                user.points -= totalDeduct;
                user.weeklyTransfers.push(now);
                db.users[targetId].points += amount;

                user.transfers.push({ type: 'send', target: targetId, amount: amount, time: now });
                db.users[targetId].transfers.push({ type: 'receive', from: chatId, amount: amount, time: now });
                saveDatabase();

                await sendMessage(chatId, `✅ **تم تحويل النقاط بنجاح!**\nتم إرسال ${amount} نقطة إلى المستخدم \`${targetId}\`\n(تم خصم عمولة 5%: ${commission} نقاط).\nرصيدك الحالي: *${user.points} نقطة*.`);
                await sendMessage(targetId, `🎁 **وصلك تحويل نقاط جديد!**\nتم استلام ${amount} نقطة من المستخدم \`${chatId}\`.\nرصيدك الحالي: *${db.users[targetId].points} نقطة*.`);
                return res.sendStatus(200);
            }

            // إدخال كوبون الخصم
            if (user.waitingForCouponApply) {
                const serviceCode = user.waitingForCouponApply;
                user.waitingForCouponApply = null;
                saveDatabase();
                const couponCode = text.trim().toUpperCase();

                if (!db.coupons[couponCode]) {
                    await sendMessage(chatId, `❌ **كوبون الخصم غير صالح أو منتهي الصلاحية!**`);
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

                await sendMessage(chatId, `✅ **تم تطبيق كوبون الخصم بنجاح (${coupon.discount}%)!**\nجاري إتمام الطلب بالأسعار المخفضة...`);
                // متابعة الطلب مع الخصم
                processOrder(chatId, serviceCode, user);
                return res.sendStatus(200);
            }

            // إدخال رابط أو يوزر الخدمة
            if (text) {
                if (user.waitingForInput) {
                    const pendingService = user.waitingForInput;
                    user.waitingForInput = null;
                    saveDatabase();

                    if (text.length < 3 || (!text.includes('http') && !text.includes('@') && !text.includes('www.'))) {
                        await sendMessage(chatId, `❌ **الرابط أو اسم المستخدم غير صحيح!** يرجى إرسال رابط صحيح أو اسم مستخدم يحتوي على (@):`);
                        user.waitingForInput = pendingService;
                        saveDatabase();
                        return res.sendStatus(200);
                    }

                    const targetInput = text;
                    const serviceData = db.services[pendingService];
                    let cost = serviceData ? serviceData.price : 90;

                    // تطبيق خصم المستوى وخصم الكوبون
                    const level = getUserLevel(user.ordersCount);
                    let discountRate = level.discount;
                    if (user.activeCoupon) {
                        discountRate += (user.activeCoupon.discount / 100);
                        user.activeCoupon = null; // استهلاك الكوبون
                    }

                    if (cost > 0 && discountRate > 0) {
                        cost = Math.round(cost * (1 - discountRate));
                    }

                    if (pendingService.startsWith('pay_')) {
                        if (user.points < cost) {
                            await sendMessage(chatId, `❌ **عذراً، رصيدك غير كافٍ!**\nلديك *${user.points} نقطة* وتحتاج إلى *${cost} نقطة* (بعد الخصومات).`);
                            return res.sendStatus(200);
                        }
                        user.points -= cost;
                    }

                    user.ordersCount += 1;
                    const orderId = (pendingService.startsWith('free_') ? 'FREE-' : 'ORD-') + Math.floor(100000 + Math.random() * 900000);
                    
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

                    // إشعارات تلقائية للعميل
                    await sendMessage(chatId, `🔔 **إشعار تلقائي:**\nتم استلام طلبك رقم \`${orderId}\` بنجاح وهو الآن **قيد التنفيذ 🚀**.`);

                    const adminMsg = `🚨 **طلب جديد وصل للبوت!**\n\n` +
                        `👤 اسم العميل: [${userName}](tg://user?id=${chatId})\n` +
                        `🏷️ معرف العميل (ID): \`${chatId}\`\n` +
                        `🪪 أسم المستخدم: \`${userUsername}\`\n` +
                        `📦 نوع الطلب: ${getServiceNiceName(pendingService)}\n` +
                        `🔗 الرابط / اسم المستخدم: \`${targetInput}\`\n` +
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

            if (data === 'check_subscription') {
                showMainMenu(chatId, messageId, true);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            // لوحة تحكم الأدمن
            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_panel') {
                const adminKeyboard = {
                    inline_keyboard: [
                        [
                            { text: '📊 عرض المستخدمين', callback_data: 'admin_users_list' },
                            { text: '🎁 رابط نقاط أزرق', callback_data: 'admin_create_gift' }
                        ],
                        [
                            { text: '🎫 إنشاء كوبون خصم', callback_data: 'admin_create_coupon' },
                            { text: '📢 إذاعة للجميع', callback_data: 'admin_broadcast' }
                        ],
                        [
                            { text: '🪙 إضافة نقاط لمستخدم', callback_data: 'admin_add_points' },
                            { text: '🚫 حظر/فك حظر مستخدم', callback_data: 'admin_ban_user' }
                        ],
                        [{ text: '⬅️ العودة للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, `🛠️ **لوحة تحكم الأدمن المنهجية المتكاملة:**`, adminKeyboard);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_broadcast') {
                user.waitingForBroadcast = true;
                saveDatabase();
                await sendMessage(chatId, `📢 **إذاعة عامة لجميع المستخدمين:**\nأرسل الآن نص الرسالة:`);
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

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_create_coupon') {
                user.waitingForCouponCreate = true;
                saveDatabase();
                await sendMessage(chatId, `🎫 **إنشاء كوبون خصم جديد:**\nأرسل بالصيغة: \`الكود النسبة\` مثل \`TURBO10 20\``);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_add_points') {
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

            // إدارة إتمام أو فشل الطلبات من الأدمن
            if (chatId.toString() === ADMIN_CHAT_ID.toString() && (data.startsWith('admin_done_') || data.startsWith('admin_fail_'))) {
                const parts = data.split('_');
                const action = parts[1];
                const targetUserChatId = parts[2];
                const orderIdStr = parts[3];

                const targetUser = db.users[targetUserChatId];
                if (targetUser && targetUser.orders) {
                    const ord = targetUser.orders.find(o => o.orderId === orderIdStr);
                    if (ord) {
                        ord.status = action === 'done' ? 'مكتمل ✅' : 'فشل / مشكلة ❌';
                        saveDatabase();
                    }
                }

                if (action === 'done') {
                    await sendMessage(targetUserChatId, `🔔 **إشعار تلقائي:**\n🎉 **تم إتمام طلبك بنجاح!**\n📌 رقم الطلب: \`${orderIdStr}\`\n\n⭐ نرجو تقييم الخدمة من قسم "سجل طلباتي":`, {
                        inline_keyboard: [[{ text: '⭐ تقييم الخدمة', callback_data: `rate_order_${orderIdStr}` }]]
                    });
                    await editMessageText(chatId, messageId, callbackQuery.message.text + `\n\n🟢 **الحالة:** تم الإتمام ✅`);
                } else {
                    await sendMessage(targetUserChatId, `🔔 **إشعار تلقائي:**\n❌ **عذراً، وُجدت مشكلة في طلبك أو لم يكتمل.**\n📌 رقم الطلب: \`${orderIdStr}\`\nتواصل مع الدعم الفني.`);
                    await editMessageText(chatId, messageId, callbackQuery.message.text + `\n\n🔴 **الحالة:** لم يتم الإتمام ❌`);
                }
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            // الهدية اليومية
            if (data === 'daily_gift') {
                if (now - user.lastDaily < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                        callback_query_id: callbackQuery.id,
                        text: '⏳ لقد استلمت هديتك اليومية مسبقاً! عُد بعد 24 ساعة.',
                        show_alert: true
                    });
                } else {
                    user.lastDaily = now;
                    user.points += 20;
                    saveDatabase();
                    await editMessageText(chatId, messageId, `🎉 **مبروك يا غالي!**\nحصلت على هديتك اليومية *20 نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`, {
                        inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
                    });
                }
            }

            // نظام الإحالات
            else if (data === 'referral_system') {
                const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${chatId}`;
                const refText = `👥 **نظام دعوة الأصدقاء (الإحالات):**\n\n` +
                    `🔗 رابط دعوتك الخاص:\n\`${refLink}\`\n\n` +
                    `🎁 المكافأة: 10 نقاط لكل صديق تنشئ له دعوة (الحد الأقصى للمكافآت 100 نقطة).\n` +
                    `👥 عدد الأشخاص الذين دعوتهم: *${user.referralCount || 0} شخص*.\n` +
                    `🪙 إجمالي نقاط الإحالات المكتسبة: *${Math.min((user.referralCount || 0) * 10, 100)} نقطة*.`;

                await editMessageText(chatId, messageId, refText, {
                    inline_keyboard: [
                        [{ text: '🏆 قائمة المتصدرين في الإحالات', callback_data: 'leaderboard' }],
                        [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                });
            }

            // لوحة المتصدرين
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

            // تحويل النقاط
            else if (data === 'transfer_points') {
                user.waitingForTransferId = true;
                saveDatabase();
                await editMessageText(chatId, messageId, `💳 **تحويل النقاط بين المستخدمين:**\n\nأرسل الآن في الشات **معرف المستخدم (ID)** الشخص المراد التحويل له:`, {
                    inline_keyboard: [[{ text: '⬅️ إلغاء', callback_data: 'main_menu' }]]
                });
            }

            // شراء النقاط
            else if (data === 'buy_points') {
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    callback_query_id: callbackQuery.id,
                    text: 'قريبًا جداً تفعيل بوابة شراء النقاط والشحن الآلي! 🚀',
                    show_alert: true
                });
            }

            // الألعاب
            else if (data === 'games_menu') {
                user.waitingForInput = null;
                saveDatabase();
                const gamesText = `🎮 **قسم الألعاب والتحديات السريعة:**\nالجائزة القصوى للفوز باللعبة 50 نقطة (متاحة مرة كل 24 ساعة):`;
                const gamesKeyboard = {
                    inline_keyboard: [
                        [{ text: '🧠 لعبة تذكر الرمز', callback_data: 'play_memory' }],
                        [{ text: '📦 صندوق الحظ', callback_data: 'play_boxes' }],
                        [{ text: '🎡 عجلة الحظ السريعة', callback_data: 'lucky_wheel' }],
                        [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, gamesText, gamesKeyboard);
            }

            else if (data === 'play_memory') {
                if (now - user.lastMemory < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⏳ لعبت مسبقاً اليوم!', show_alert: true });
                    return res.sendStatus(200);
                }
                user.lastMemory = now;
                const prize = Math.floor(Math.random() * 30) + 20; // بحد أقصى 50 نقطة
                user.points += prize;
                saveDatabase();
                await editMessageText(chatId, messageId, `🧠 **مبروك فوزك في لعبة تذكر الرمز!**\nربحت *${prize} نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`, {
                    inline_keyboard: [[{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]]
                });
            }

            else if (data === 'play_boxes') {
                if (now - user.lastBoxes < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⏳ لعبت مسبقاً اليوم!', show_alert: true });
                    return res.sendStatus(200);
                }
                user.lastBoxes = now;
                const prize = Math.floor(Math.random() * 40) + 10;
                user.points += prize;
                saveDatabase();
                await editMessageText(chatId, messageId, `📦 **اخترت الصندوق الرابح!**\nربحت *${prize} نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`, {
                    inline_keyboard: [[{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]]
                });
            }

            else if (data === 'lucky_wheel') {
                if (now - user.lastWheel < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⏳ لعبت مسبقاً اليوم!', show_alert: true });
                    return res.sendStatus(200);
                }
                user.lastWheel = now;
                const prize = Math.floor(Math.random() * 45) + 5;
                user.points += prize;
                saveDatabase();
                await editMessageText(chatId, messageId, `🎡 **دَارت عجلة الحظ!**\nربحت *${prize} نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`, {
                    inline_keyboard: [[{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]]
                });
            }

            // المتجر والخدمات
            else if (data === 'services_menu') {
                user.waitingForInput = null;
                saveDatabase();
                const servText = `📦 **قسم المتجر والخدمات:**\nاختر القسم المطلوب:`;
                const servKeyboard = {
                    inline_keyboard: [
                        [{ text: '🎵 خدمات تيك توك', callback_data: 'platform_tiktok' }],
                        [{ text: '📺 خدمات يوتيوب', callback_data: 'platform_youtube' }],
                        [{ text: '📸 خدمات انستقرام', callback_data: 'platform_insta' }],
                        [{ text: '💜 خدمات تويتش (Twitch)', callback_data: 'platform_twitch' }],
                        [{ text: '✈️ خدمات تيليجرام', callback_data: 'platform_telegram' }],
                        [{ text: '✖️ خدمات منصة X (تويتر)', callback_data: 'platform_x' }],
                        [{ text: '🛒 إنشاء متجر متكامل (1000 نقطة)', callback_data: 'pay_store_create' }],
                        [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, servText, servKeyboard);
            }

            // المنصات (تيك توك، يوتيوب، انستقرام، تويتش، تيليجرام، X)
            else if (data === 'platform_tiktok') {
                await editMessageText(chatId, messageId, `🎵 **قسم تيك توك:**`, {
                    inline_keyboard: [
                        [{ text: '🆓 خدمة مجانية: تكبيس لايف', callback_data: 'free_tk_live' }],
                        [{ text: '🆓 خدمة مجانية: لايكات مقطع', callback_data: 'free_tk_like' }],
                        [{ text: '👥 متابعين تيك توك', callback_data: 'tk_followers' }],
                        [{ text: '👁️ مشاهدات تيك توك', callback_data: 'tk_views' }],
                        [{ text: '⬅️ رجوع للمتجر', callback_data: 'services_menu' }]
                    ]
                });
            }
            else if (data === 'tk_followers') {
                await editMessageText(chatId, messageId, `👥 **باقات متابعين تيك توك:**`, {
                    inline_keyboard: [
                        [{ text: '👤 10 إلى 50 متابع (90 نقطة)', callback_data: 'pay_tk_f1' }],
                        [{ text: '👤 50 إلى 100 متابع (180 نقطة)', callback_data: 'pay_tk_f2' }],
                        [{ text: '👤 100 إلى 200 متابع (320 نقطة)', callback_data: 'pay_tk_f3' }],
                        [{ text: '⬅️ رجوع', callback_data: 'platform_tiktok' }]
                    ]
                });
            }
            else if (data === 'tk_views') {
                await editMessageText(chatId, messageId, `👁️ **باقات مشاهدات تيك توك:**`, {
                    inline_keyboard: [
                        [{ text: '📊 100 إلى 1000 مشاهدة (80 نقطة)', callback_data: 'pay_tk_v1' }],
                        [{ text: '📊 1000 إلى 10000 مشاهدة (300 نقطة)', callback_data: 'pay_tk_v2' }],
                        [{ text: '⬅️ رجوع', callback_data: 'platform_tiktok' }]
                    ]
                });
            }

            else if (data === 'platform_youtube') {
                await editMessageText(chatId, messageId, `📺 **قسم يوتيوب:**`, {
                    inline_keyboard: [
                        [{ text: '🆓 تفاعلات لايف يوتيوب', callback_data: 'free_yt_live' }],
                        [{ text: '🆓 لايكات فيديو يوتيوب', callback_data: 'free_yt_like' }],
                        [{ text: '👥 مشتركين يوتيوب', callback_data: 'yt_followers' }],
                        [{ text: '👁️ مشاهدات يوتيوب', callback_data: 'yt_views' }],
                        [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                    ]
                });
            }
            else if (data === 'yt_followers') {
                await editMessageText(chatId, messageId, `👥 **باقات مشتركين يوتيوب:**`, {
                    inline_keyboard: [
                        [{ text: '👤 10 إلى 50 مشترك (110 نقطة)', callback_data: 'pay_yt_f1' }],
                        [{ text: '👤 50 إلى 100 مشترك (220 نقطة)', callback_data: 'pay_yt_f2' }],
                        [{ text: '👤 100 إلى 200 مشترك (400 نقطة)', callback_data: 'pay_yt_f3' }],
                        [{ text: '⬅️ رجوع', callback_data: 'platform_youtube' }]
                    ]
                });
            }
            else if (data === 'yt_views') {
                await editMessageText(chatId, messageId, `👁️ **باقات مشاهدات يوتيوب:**`, {
                    inline_keyboard: [
                        [{ text: '📊 100 إلى 1000 مشاهدة (90 نقطة)', callback_data: 'pay_yt_v1' }],
                        [{ text: '📊 1000 إلى 10000 مشاهدة (350 نقطة)', callback_data: 'pay_yt_v2' }],
                        [{ text: '⬅️ رجوع', callback_data: 'platform_youtube' }]
                    ]
                });
            }

            else if (data === 'platform_insta') {
                await editMessageText(chatId, messageId, `📸 **قسم انستقرام:**`, {
                    inline_keyboard: [
                        [{ text: '🆓 تفاعلات لايف انستقرام', callback_data: 'free_in_live' }],
                        [{ text: '🆓 لايكات ريلز/منشور', callback_data: 'free_in_like' }],
                        [{ text: '👥 متابعين انستقرام', callback_data: 'in_followers' }],
                        [{ text: '👁️ مشاهدات انستقرام', callback_data: 'in_views' }],
                        [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                    ]
                });
            }
            else if (data === 'in_followers') {
                await editMessageText(chatId, messageId, `👥 **باقات متابعين انستقرام:**`, {
                    inline_keyboard: [
                        [{ text: '👤 10 إلى 50 متابع (100 نقطة)', callback_data: 'pay_in_f1' }],
                        [{ text: '👤 50 إلى 100 متابع (200 نقطة)', callback_data: 'pay_in_f2' }],
                        [{ text: '👤 100 إلى 200 متابع (360 نقطة)', callback_data: 'pay_in_f3' }],
                        [{ text: '⬅️ رجوع', callback_data: 'platform_insta' }]
                    ]
                });
            }
            else if (data === 'in_views') {
                await editMessageText(chatId, messageId, `👁️ **باقات مشاهدات انستقرام:**`, {
                    inline_keyboard: [
                        [{ text: '📊 100 إلى 1000 مشاهدة (85 نقطة)', callback_data: 'pay_in_v1' }],
                        [{ text: '📊 1000 إلى 10000 مشاهدة (320 نقطة)', callback_data: 'pay_in_v2' }],
                        [{ text: '⬅️ رجوع', callback_data: 'platform_insta' }]
                    ]
                });
            }

            else if (data === 'platform_twitch') {
                await editMessageText(chatId, messageId, `💜 **قسم تويتش (Twitch):**`, {
                    inline_keyboard: [
                        [{ text: '👤 متابعين تويتش (10 إلى 50) - 95 نقطة', callback_data: 'pay_tw_f1' }],
                        [{ text: '👤 متابعين تويتش (50 إلى 100) - 190 نقطة', callback_data: 'pay_tw_f2' }],
                        [{ text: '👁️ مشاهدات بث تويتش - 120 نقطة', callback_data: 'pay_tw_v1' }],
                        [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                    ]
                });
            }

            else if (data === 'platform_telegram') {
                await editMessageText(chatId, messageId, `✈️ **قسم تيليجرام:**`, {
                    inline_keyboard: [
                        [{ text: '👤 متابعين وقنوات تيليجرام (90 نقطة)', callback_data: 'pay_tg_f1' }],
                        [{ text: '👁️ مشاهدات منشورات تيليجرام (75 نقطة)', callback_data: 'pay_tg_v1' }],
                        [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                    ]
                });
            }

            else if (data === 'platform_x') {
                await editMessageText(chatId, messageId, `✖️ **قسم منصة X (تويتر سابقاً):**`, {
                    inline_keyboard: [
                        [{ text: '👤 متابعين منصة X (100 نقطة)', callback_data: 'pay_x_f1' }],
                        [{ text: '❤️ تفاعلات منشورات X (85 نقطة)', callback_data: 'pay_x_v1' }],
                        [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                    ]
                });
            }

            // اختيار خدمة (مدفوعة أو مجانية)
            else if (data.startsWith('free_') || data.startsWith('pay_')) {
                const serviceKey = data;
                const serviceData = db.services[serviceKey];
                let cost = serviceData ? serviceData.price : 90;

                if (serviceKey.startsWith('pay_') && serviceKey !== 'pay_store_create') {
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

                await editMessageText(chatId, messageId, `🔗 **أرسل الآن في الشات رابط الحساب أو القناة المطلوبة للخدمة:**\n*(مع تكلفة مقدرة بعد خصم مستواك: ${cost} نقطة)*\n\nأو هل لديك **كوبون خصم**؟ أرسل الكوبون أولاً أو الرابط مباشرة:`, {
                    inline_keyboard: [
                        [{ text: '🎫 إدخال كوبون خصم', callback_data: `apply_coupon_${serviceKey}` }],
                        [{ text: '⬅️ إلغاء والعودة للمتجر', callback_data: 'services_menu' }]
                    ]
                });
            }

            else if (data.startsWith('apply_coupon_')) {
                const serviceKey = data.replace('apply_coupon_', '');
                user.waitingForCouponApply = serviceKey;
                saveDatabase();
                await editMessageText(chatId, messageId, `🎫 **أدخل كود كوبون الخصم الآن في الشات:**\n(مثال: \`TURBO10\`)`, {
                    inline_keyboard: [[{ text: '⬅️ رجوع', callback_data: serviceKey }]]
                });
            }

            // سجل الطلبات
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
                await editMessageText(chatId, messageId, `⭐ **اختر رقم الطلب المراد تقييمه من 1 إلى 5:**`, { inline_keyboard: kb });
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

                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: `✅ شكراً لتقييمك الخدمة بـ ${stars} نجوم!`, show_alert: true });
                showMainMenu(chatId, messageId, true);
            }

            // حسابي ونقاطي والمستوى
            else if (data === 'my_account') {
                const level = getUserLevel(user.ordersCount);
                const accText = `👤 **معلومات حسابك ونظام المستويات:**\n\n` +
                    `🪙 النقاط المتوفرة: *${user.points} نقطة*\n` +
                    `🏆 مستواك الحالي: *${level.name}*\n` +
                    `📉 نسبة الخصم لمستواك: *${level.discount * 100}%*\n` +
                    `📦 عدد الطلبات الكلي: *${user.ordersCount} طلب*\n` +
                    `🏷️ المعرف (ID): \`${chatId}\``;
                
                await editMessageText(chatId, messageId, accText, {
                    inline_keyboard: [
                        [{ text: '🎁 نظام الإحالات والدعوات', callback_data: 'referral_system' }],
                        [{ text: '💳 تحويل النقاط', callback_data: 'transfer_points' }],
                        [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                });
            }

            // تتبع آخر طلب
            else if (data === 'track_order') {
                if (!user.lastOrder || !user.orders || user.orders.length === 0) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id, text: '⚠️ ليس لديك أي طلبات سابقة لتتبعها!', show_alert: true });
                } else {
                    const lastOrd = user.orders[user.orders.length - 1];
                    await editMessageText(chatId, messageId, `📌 **تتبع الطلب الأخير:**\n\nرقم الطلب: \`${lastOrd.orderId}\`\nالخدمة: ${lastOrd.serviceName}\nحالة الطلب: ${lastOrd.status}\n🤍`, {
                        inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
                    });
                }
            }

            // الدعم الفني
            else if (data === 'support') {
                await editMessageText(chatId, messageId, `🛠️ **الدعم الفني والخدمات:**\n👤 تواصل مع الإدارة: @abod097644`, {
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
    const menuText = `🎛️ **القائمة الرئيسية لمتجر الأداء والخدمات:**\n\n` +
        `🪙 رصيدك الحالي: *${user.points} نقطة*\n` +
        `🏆 مستواك: *${level.name}*\n\n` +
        `🌹 منور المتجر يا غالي، اختر ما يناسبك من الخدمات والألعاب والتحديات 🤍✨`;

    let keyboardRows = [
        [
            { text: '🎁 الهدية اليومية', callback_data: 'daily_gift' },
            { text: '🛍️ المتجر والخدمات', callback_data: 'services_menu' }
        ],
        [
            { text: '👥 نظام الإحالات', callback_data: 'referral_system' },
            { text: '💳 تحويل النقاط', callback_data: 'transfer_points' }
        ],
        [
            { text: '🎮 الألعاب والنقاط', callback_data: 'games_menu' },
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
        keyboardRows.push([{ text: '📊 لوحة تحكم الأدمن الشاملة', callback_data: 'admin_panel' }]);
    }

    const menuKeyboard = { inline_keyboard: keyboardRows };

    if (edit && messageId) {
        editMessageText(chatId, messageId, menuText, menuKeyboard);
    } else {
        sendMessage(chatId, menuText, menuKeyboard);
    }
}

function processOrder(chatId, serviceKey, user) {
    // معالجة فورية للطلب بعد الكوبون
    user.ordersCount += 1;
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const serviceData = db.services[serviceKey];
    let cost = serviceData ? serviceData.price : 90;
    
    if (user.points < cost) {
        sendMessage(chatId, `❌ رصيدك غير كافٍ بعد الخصم.`);
        return;
    }
    user.points -= cost;
    user.lastOrder = orderId;
    saveDatabase();
    sendMessage(chatId, `✅ **تم قبول وتأكيد طلبك بنجاح برقم:** \`${orderId}\`\nجاري التنفيذ... 🚀`);
}

app.get('/', (req, res) => {
    res.send('Bot is running successfully with all advanced features & persistent database!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

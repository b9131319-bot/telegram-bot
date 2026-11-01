const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// التعديل الأمني: سحب التوكن من متغيرات البيئة لمنع الاختراق
const TOKEN = process.env.TOKEN;
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
        // قسم الخدمات المدفوعة (أسعار متوسطة إلى عالية)
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

        // قسم الخدمات المجانية
        'free_service_1': { name: 'خدمة مجانية: 100 مشاهدة تيك توك مصغرة', price: 0, category: 'free' },
        'free_service_2': { name: 'خدمة مجانية: 20 لايك انستقرام مصغر', price: 0, category: 'free' },
        'free_service_3': { name: 'خدمة مجانية: 10 متابعين تيليجرام تجريبي', price: 0, category: 'free' },
        'free_service_4': { name: 'خدمة مجانية: 50 مشاهدة يوتيوب تجريبية', price: 0, category: 'free' }
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
                    lastMemory: 0,
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
                    waitingForCouponApply: null,
                    waitingForAdminAddPoints: null,
                    waitingForAdminBan: null
                };
                saveDatabase();
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
                        await sendMessage(uid, `📢 **رسالة من الإدارة:**\n\n${text}`);
                        successCount++;
                    } catch (e) {}
                }
                await sendMessage(ADMIN_CHAT_ID, `✅ **تم إرسال الإذاعة بنجاح إلى ${successCount} مستخدم.**`);
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

            if (user.waitingForFlagAnswer) {
                const correctFlag = user.waitingForFlagAnswer;
                user.waitingForFlagAnswer = null;
                saveDatabase();

                if (text.trim() === correctFlag) {
                    user.points += 20;
                    saveDatabase();
                    await sendMessage(chatId, `🎉 **إجابة صحيحة!** ربحت *20 نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`);
                } else {
                    user.points += 5;
                    saveDatabase();
                    await sendMessage(chatId, `❌ **إجابة خاطئة!** العلم الصحيح كان: ${correctFlag}\nتم منحك *5 نقاط* كتعويض 🪙.\nرصيدك الحالي: ${user.points} نقطة.`);
                }
                return res.sendStatus(200);
            }

            if (user.waitingForMathAnswer) {
                const correctAnswer = user.waitingForMathAnswer;
                user.waitingForMathAnswer = null;
                saveDatabase();

                if (parseInt(text.trim()) === correctAnswer) {
                    user.points += 20;
                    saveDatabase();
                    await sendMessage(chatId, `🎉 **إجابة صحيحة!** ربحت *20 نقطة* 🪙.\nرصيدك الحالي: ${user.points} نقطة.`);
                } else {
                    user.points += 5;
                    saveDatabase();
                    await sendMessage(chatId, `❌ **إجابة خاطئة!** الناتج الصحيح كان: ${correctAnswer}\nتم منحك *5 نقاط* كتعويض 🪙.\nرصيدك الحالي: ${user.points} نقطة.`);
                }
                return res.sendStatus(200);
            }

            if (text && text.startsWith('/start ')) {
                const payload = text.split(' ')[1];

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

                if (payload && payload.startsWith('ref_')) {
                    const inviterId = payload.split('_')[1];
                    if (inviterId && inviterId !== chatId.toString() && db.users[inviterId] && !user.referredBy) {
                        user.referredBy = inviterId;
                        const inviter = db.users[inviterId];
                        if (inviter.referralCount < 100) {
                            inviter.referralCount += 1;
                            const reward = 10;
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
                    await sendMessage(chatId, `⚠️ **عذراً، لقد استنفدت الحد الأقصى للتحويل (مرتين أسبوعياً).**`);
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
                        await sendMessage(chatId, `❌ **الرابط أو اسم المستخدم غير صحيح!** يرجى إرسال رابط صحيح أو اسم مستخدم يحتوي على (@):`);
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

                        await sendMessage(chatId, `🎁 **تم استلام طلب الخدمة المجانية!**\n📌 رقم الطلب: \`${orderId}\`\n\n⚠️ **ملاحظة:** قد يوافق المتجر على تنفيذ طلبك أو يرفضه بناءً على التوفر. يمكنك متابعة حالته في "سجل طلباتي".`);
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

                    await sendMessage(chatId, `🔔 **إشعار تلقائي:**\nتم قبول طلبك برقم \`${orderId}\` وهو الآن **قيد التنفيذ 🚀**.`);

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

            if (data === 'check_subscription') {
                showMainMenu(chatId, messageId, true);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

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
                await editMessageText(chatId, messageId, `🛠️ **لوحة تحكم الأدمن:**`, adminKeyboard);
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
            }
        }
    } catch (e) {
        console.error('Webhook error:', e);
    }
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

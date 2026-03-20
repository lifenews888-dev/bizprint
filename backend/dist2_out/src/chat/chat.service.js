"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_message_entity_1 = require("./chat-message.entity");
const chat_room_entity_1 = require("./chat-room.entity");
let ChatService = class ChatService {
    constructor(msgRepo, roomRepo) {
        this.msgRepo = msgRepo;
        this.roomRepo = roomRepo;
    }
    async getOrCreateRoom(params) {
        const sorted = [...params.participants].sort();
        const room_id = params.orderId
            ? 'order-' + params.orderId + '-' + sorted.join('-')
            : sorted.join('-');
        let room = await this.roomRepo.findOne({ where: { room_id } });
        if (!room) {
            room = this.roomRepo.create({
                room_id,
                type: params.type,
                order_id: params.orderId,
                participants: params.participants,
                participant_names: params.participantNames,
            });
            await this.roomRepo.save(room);
        }
        return room;
    }
    async getRoomsForUser(userId) {
        const rooms = await this.roomRepo.find({
            order: { last_message_at: 'DESC' },
        });
        return rooms.filter(r => r.participants.includes(userId));
    }
    async getAllRooms() {
        return this.roomRepo.find({ order: { last_message_at: 'DESC' } });
    }
    async getMessages(room_id, limit = 50) {
        return this.msgRepo.find({
            where: { room_id },
            order: { created_at: 'ASC' },
            take: limit,
        });
    }
    async saveMessage(data) {
        const msg = this.msgRepo.create(data);
        const saved = await this.msgRepo.save(msg);
        await this.roomRepo.update({ room_id: data.room_id }, { last_message: data.message, last_message_at: new Date() });
        return saved;
    }
    async markRead(room_id, user_id) {
        await this.msgRepo.update({ room_id, is_read: false }, { is_read: true });
        await this.roomRepo.update({ room_id }, { unread_count: 0 });
    }
    async getUnreadCount(userId) {
        const rooms = await this.getRoomsForUser(userId);
        const ids = rooms.map(r => r.room_id);
        if (ids.length === 0)
            return 0;
        let count = 0;
        for (const id of ids) {
            const c = await this.msgRepo.count({ where: { room_id: id, is_read: false } });
            count += c;
        }
        return count;
    }
    async fixParticipantNames() {
        const rooms = await this.roomRepo.find();
        const userRepo = this.roomRepo.manager.getRepository('User');
        let fixed = 0;
        for (const room of rooms) {
            const names = await Promise.all(room.participants.map(async (pid) => {
                if (pid === 'admin')
                    return 'Admin';
                try {
                    const user = await userRepo.findOne({ where: { id: pid } });
                    if (user)
                        return user.full_name || user.email || pid;
                }
                catch { }
                return pid;
            }));
            room.participant_names = names;
            await this.roomRepo.save(room);
            fixed++;
        }
        return { fixed, message: 'Done' };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_room_entity_1.ChatRoom)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ChatService);
//# sourceMappingURL=chat.service.js.map
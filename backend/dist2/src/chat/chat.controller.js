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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    getAllRooms() {
        return this.chatService.getAllRooms();
    }
    getUserRooms(userId) {
        return this.chatService.getRoomsForUser(userId);
    }
    getMessages(roomId) {
        return this.chatService.getMessages(roomId);
    }
    getUnread(userId) {
        return this.chatService.getUnreadCount(userId);
    }
    fixNames() {
        return this.chatService.fixParticipantNames();
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('rooms'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getAllRooms", null);
__decorate([
    (0, common_1.Get)('rooms/user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getUserRooms", null);
__decorate([
    (0, common_1.Get)('messages/:roomId'),
    __param(0, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Get)('unread/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getUnread", null);
__decorate([
    (0, common_1.Post)('fix-names'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "fixNames", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map
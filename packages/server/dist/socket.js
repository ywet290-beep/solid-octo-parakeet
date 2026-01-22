"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// In-memory storage for typing indicators (in production, use Redis)
const typingUsers = {};
// Clean up old typing indicators
setInterval(() => {
    const now = Date.now();
    Object.keys(typingUsers).forEach(roomId => {
        Object.keys(typingUsers[roomId]).forEach(userId => {
            if (now - typingUsers[roomId][userId].timestamp > 3000) { // 3 seconds
                delete typingUsers[roomId][userId];
            }
        });
        if (Object.keys(typingUsers[roomId]).length === 0) {
            delete typingUsers[roomId];
        }
    });
}, 1000);
// Authentication middleware for sockets
const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
        return next(new Error('Authentication token required'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        socket.userId = decoded.userId;
        socket.username = decoded.username;
        socket.roomsJoined = [];
        next();
    }
    catch (err) {
        next(new Error('Invalid token'));
    }
};
// Main socket handler
const initializeSocket = (io) => {
    io.use(authenticateSocket);
    io.on('connection', (socket) => {
        console.log(`User ${socket.username} (${socket.userId}) connected`);
        // Join room
        socket.on('join-room', async (data) => {
            try {
                const { roomId, password } = data;
                // Validate room exists (simplified)
                // const room = await RoomModel.findById(roomId);
                // if (!room) throw new Error('Room not found');
                // Check permissions
                // if (room.privacy === 'private' && !room.members.some(m => m.userId === socket.userId)) {
                //   throw new Error('Not authorized to join this room');
                // }
                // if (room.password && room.password !== password) {
                //   throw new Error('Incorrect password');
                // }
                socket.join(roomId);
                if (!socket.roomsJoined.includes(roomId)) {
                    socket.roomsJoined.push(roomId);
                }
                // Notify others in the room
                socket.to(roomId).emit('user-joined', {
                    userId: socket.userId,
                    username: socket.username,
                    roomId,
                    timestamp: new Date()
                });
                // Send room info to user
                socket.emit('joined-room', {
                    roomId,
                    success: true,
                    message: `Joined room ${roomId}`
                });
                console.log(`User ${socket.username} joined room ${roomId}`);
            }
            catch (error) {
                socket.emit('error', {
                    event: 'join-room',
                    message: error.message
                });
            }
        });
        // Leave room
        socket.on('leave-room', async (data) => {
            try {
                const { roomId } = data;
                socket.leave(roomId);
                const index = socket.roomsJoined.indexOf(roomId);
                if (index > -1) {
                    socket.roomsJoined.splice(index, 1);
                }
                // Notify others
                socket.to(roomId).emit('user-left', {
                    userId: socket.userId,
                    username: socket.username,
                    roomId,
                    timestamp: new Date()
                });
                // Clean up typing indicator
                if (typingUsers[roomId] && typingUsers[roomId][socket.userId]) {
                    delete typingUsers[roomId][socket.userId];
                    io.to(roomId).emit('typing-update', {
                        roomId,
                        users: Object.values(typingUsers[roomId]).map(u => ({ username: u.username, isTyping: true }))
                    });
                }
                socket.emit('left-room', {
                    roomId,
                    success: true,
                    message: `Left room ${roomId}`
                });
                console.log(`User ${socket.username} left room ${roomId}`);
            }
            catch (error) {
                socket.emit('error', {
                    event: 'leave-room',
                    message: error.message
                });
            }
        });
        // Typing indicator
        socket.on('typing', (data) => {
            const { roomId, isTyping } = data;
            if (!socket.roomsJoined.includes(roomId)) {
                return;
            }
            if (isTyping) {
                if (!typingUsers[roomId]) {
                    typingUsers[roomId] = {};
                }
                typingUsers[roomId][socket.userId] = {
                    username: socket.username,
                    timestamp: Date.now()
                };
            }
            else {
                if (typingUsers[roomId] && typingUsers[roomId][socket.userId]) {
                    delete typingUsers[roomId][socket.userId];
                }
            }
            // Broadcast to room
            io.to(roomId).emit('typing-update', {
                roomId,
                users: Object.values(typingUsers[roomId] || {}).map(u => ({ username: u.username, isTyping: true }))
            });
        });
        // Send message
        socket.on('send-message', async (data) => {
            try {
                const { roomId, content, type = 'text', attachments = [], threadId } = data;
                if (!socket.roomsJoined.includes(roomId)) {
                    throw new Error('Not in room');
                }
                if (!content.trim()) {
                    throw new Error('Message content cannot be empty');
                }
                // Create message object
                const message = {
                    _id: new mongoose_1.default.Types.ObjectId().toString(),
                    roomId,
                    userId: socket.userId,
                    content: content.trim(),
                    type,
                    timestamp: new Date(),
                    threadId,
                    reactions: [],
                    attachments,
                    mentions: [], // TODO: parse mentions
                    links: [], // TODO: parse links
                    editHistory: [],
                    isEdited: false,
                    isDeleted: false,
                    pinned: false,
                    starred: false,
                    starredBy: [],
                    readBy: [],
                    deliveredTo: [],
                    metadata: {}
                };
                // Save to database (simplified)
                // await MessageModel.create(message);
                // Broadcast to room
                io.to(roomId).emit('new-message', {
                    message,
                    roomId
                });
                // If thread, also emit to thread
                if (threadId) {
                    io.to(threadId).emit('thread-message', {
                        message,
                        threadId
                    });
                }
                console.log(`Message sent in room ${roomId} by ${socket.username}`);
            }
            catch (error) {
                socket.emit('error', {
                    event: 'send-message',
                    message: error.message
                });
            }
        });
        // Edit message
        socket.on('edit-message', async (data) => {
            try {
                const { messageId, newContent, roomId } = data;
                if (!socket.roomsJoined.includes(roomId)) {
                    throw new Error('Not in room');
                }
                // Find message (simplified)
                // const message = await MessageModel.findById(messageId);
                // if (!message) throw new Error('Message not found');
                // if (message.userId !== socket.userId) throw new Error('Not authorized');
                // Update message
                // const editEntry = {
                //   _id: new mongoose.Types.ObjectId().toString(),
                //   oldContent: message.content,
                //   newContent,
                //   editedBy: socket.userId,
                //   editedAt: new Date()
                // };
                // message.content = newContent;
                // message.isEdited = true;
                // message.editHistory.push(editEntry);
                // message.editedAt = new Date();
                // await message.save();
                // Broadcast update
                io.to(roomId).emit('message-edited', {
                    messageId,
                    newContent,
                    editedBy: socket.userId,
                    editedAt: new Date(),
                    roomId
                });
                console.log(`Message ${messageId} edited by ${socket.username}`);
            }
            catch (error) {
                socket.emit('error', {
                    event: 'edit-message',
                    message: error.message
                });
            }
        });
        // Delete message
        socket.on('delete-message', async (data) => {
            try {
                const { messageId, roomId } = data;
                if (!socket.roomsJoined.includes(roomId)) {
                    throw new Error('Not in room');
                }
                // Find and delete message (simplified)
                // const message = await MessageModel.findById(messageId);
                // if (!message) throw new Error('Message not found');
                // if (message.userId !== socket.userId) throw new Error('Not authorized');
                // message.isDeleted = true;
                // message.deletedAt = new Date();
                // message.deletedBy = socket.userId;
                // await message.save();
                // Broadcast deletion
                io.to(roomId).emit('message-deleted', {
                    messageId,
                    deletedBy: socket.userId,
                    deletedAt: new Date(),
                    roomId
                });
                console.log(`Message ${messageId} deleted by ${socket.username}`);
            }
            catch (error) {
                socket.emit('error', {
                    event: 'delete-message',
                    message: error.message
                });
            }
        });
        // Add reaction
        socket.on('add-reaction', async (data) => {
            try {
                const { messageId, emoji, roomId } = data;
                if (!socket.roomsJoined.includes(roomId)) {
                    throw new Error('Not in room');
                }
                // Find message and add reaction (simplified)
                // const message = await MessageModel.findById(messageId);
                // if (!message) throw new Error('Message not found');
                // let reaction = message.reactions.find(r => r.emoji === emoji);
                // if (!reaction) {
                //   reaction = { _id: new mongoose.Types.ObjectId().toString(), emoji, type: 'emoji', users: [], count: 0, createdAt: new Date() };
                //   message.reactions.push(reaction);
                // }
                // if (!reaction.users.includes(socket.userId!)) {
                //   reaction.users.push(socket.userId!);
                //   reaction.count++;
                // }
                // await message.save();
                // Broadcast reaction
                io.to(roomId).emit('reaction-added', {
                    messageId,
                    emoji,
                    userId: socket.userId,
                    username: socket.username,
                    roomId
                });
                console.log(`Reaction added to message ${messageId} by ${socket.username}`);
            }
            catch (error) {
                socket.emit('error', {
                    event: 'add-reaction',
                    message: error.message
                });
            }
        });
        // WebRTC Signaling
        socket.on('call-user', (data) => {
            io.to(data.userToCall).emit('call-made', {
                signal: data.signalData,
                from: socket.userId,
                name: socket.username
            });
        });
        socket.on('answer-call', (data) => {
            io.to(data.to).emit('call-answered', {
                signal: data.signalData,
                from: socket.userId
            });
        });
        socket.on('ice-candidate', (data) => {
            io.to(data.to).emit('ice-candidate', {
                candidate: data.candidate,
                from: socket.userId
            });
        });
        socket.on('end-call', (data) => {
            io.to(data.to).emit('call-ended', {
                from: socket.userId
            });
        });
        // Disconnect
        socket.on('disconnect', () => {
            console.log(`User ${socket.username} (${socket.userId}) disconnected`);
            // Clean up typing indicators
            socket.roomsJoined.forEach(roomId => {
                if (typingUsers[roomId] && typingUsers[roomId][socket.userId]) {
                    delete typingUsers[roomId][socket.userId];
                    io.to(roomId).emit('typing-update', {
                        roomId,
                        users: Object.values(typingUsers[roomId]).map(u => ({ username: u.username, isTyping: true }))
                    });
                }
            });
        });
    });
};
exports.initializeSocket = initializeSocket;
//# sourceMappingURL=socket.js.map
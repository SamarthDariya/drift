const WebSocket = require('ws');
const chalk = require('chalk');

class ChatClient {
    constructor(display) {
        this.ws = null;
        this.nickname = null;
        this.roomCode = null;
        this.isConnected = false;
        this.display = display;
    }

    async connectToServer() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket('wss://drift.abhinavaditya.com');
            
            this.ws.on('open', () => {
                this.isConnected = true;
                resolve();
            });

            this.ws.on('error', (error) => {
                reject(new Error('Failed to connect to drift.abhinavaditya.com. Please check your internet connection.'));
            });

            this.ws.on('message', (data) => {
                this.handleMessage(JSON.parse(data.toString()));
            });

            this.ws.on('close', () => {
                if (this.isConnected) {
                    if (this.display.incognito) {
                        console.log(this.display.logLine('WARN', 'net.gateway', 'connection reset'));
                    } else {
                        console.log(chalk.red('\n💔 Connection lost. Exiting...'));
                    }
                    process.exit(0);
                }
            });
        });
    }

    createRoom() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'create_room' }));
        }
    }

    joinRoom(roomCode, nickname) {
        this.nickname = nickname;
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'join_room',
                roomCode: roomCode.toUpperCase(),
                nickname: nickname
            }));
        }
    }

    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'send_message',
                roomCode: this.roomCode,
                message: message
            }));
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'room_created':
                this.roomCode = message.roomCode;
                if (this.display.incognito) {
                    console.log(this.display.boot(`room=${message.roomCode} listening`));
                } else {
                    console.log(chalk.green.bold(`\n✅ Room created successfully!`));
                    console.log(chalk.cyan(`📋 Room Code: ${message.roomCode}`));
                    console.log(chalk.gray('Share this code with others to invite them.\n'));
                }
                this.ws.send(JSON.stringify({
                    type: 'join_room',
                    roomCode: message.roomCode,
                    nickname: this.nickname
                }));
                break;

            case 'joined_room':
                this.roomCode = message.roomCode;
                if (this.display.incognito) {
                    if (message.messages && message.messages.length > 0) {
                        message.messages.forEach(msg => {
                            this.display.displayMessage(msg, this.nickname);
                        });
                    }
                    console.log(this.display.boot('session established'));
                } else {
                    console.log(chalk.green.bold(`\n🎉 Joined room ${message.roomCode}!`));
                    if (message.messages && message.messages.length > 0) {
                        console.log(chalk.gray('\n--- Previous Messages ---'));
                        message.messages.forEach(msg => {
                            this.display.displayMessage(msg, this.nickname);
                        });
                        console.log(chalk.gray('--- End of Previous Messages ---\n'));
                    }
                }
                return 'joined_room';
                break;

            case 'message':
                this.display.displayMessage(message, this.nickname);
                break;

            case 'user_joined':
                if (message.nickname !== this.nickname) {
                    this.display.displaySystemMessage(`${message.nickname} joined the room`);
                }
                break;

            case 'user_left':
                this.display.displaySystemMessage(`${message.nickname} left the room`);
                break;

            case 'error':
                if (this.display.incognito) {
                    console.log(this.display.logLine('ERROR', 'net.gateway', message.message));
                } else {
                    console.error(chalk.red(`❌ Error: ${message.message}`));
                }
                setTimeout(() => {
                    return 'error';
                }, 1000);
                break;
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

module.exports = ChatClient;
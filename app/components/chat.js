'use client';

import { useState, useEffect, useRef } from 'react';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [ws, setWs] = useState(null);
    const [username, setUsername] = useState('');
    const [isUsernameSet, setIsUsernameSet] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [isWsConnected, setIsWsConnected] = useState(false); // Track WebSocket connection status
    const messagesEndRef = useRef(null); // Ref to track the end of the messages

    useEffect(() => {
        //const socket = new WebSocket('ws://145.223.120.127:3001'); // Replace with your VPS IP
        const socket = new WebSocket('ws://192.168.1.49:3001'); // Replace with your VPS IP
        setWs(socket);

        socket.onopen = () => {
            setIsWsConnected(true); // WebSocket connection is now open
            console.log('WebSocket connection established.');
        };

        socket.onmessage = (event) => {
            const parsedData = JSON.parse(event.data);

            if (parsedData.type === 'message') {
                setMessages((prevMessages) => [...prevMessages, parsedData.data]);
            } else if (parsedData.type === 'users') {
                setConnectedUsers(parsedData.data); // Update connected users as soon as it's broadcasted
            } else if (parsedData.type === 'history') {
                setMessages(parsedData.data); // Set chat history when the user connects or re-enters
            }
        };

        socket.onclose = () => {
            setIsWsConnected(false); // WebSocket connection closed
            console.log('WebSocket connection closed.');
        };

        return () => {
            socket.close();
        };
    }, []);

    // Scroll to the bottom whenever a new message is received
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSetUsername = () => {
        if (username.trim() && isWsConnected) {
            setIsUsernameSet(true);
            // Send a special "set_username" message to the backend
            ws.send(JSON.stringify({ type: 'set_username', username }));
        } else {
            console.log('WebSocket is not ready to send messages.');
        }
    };

    const sendMessage = () => {
        if (ws && input && isWsConnected) {
            const messageData = { type: 'chat_message', username, message: input };
            ws.send(JSON.stringify(messageData));
            setInput('');
        } else {
            console.log('WebSocket is not ready or message is empty.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="flex max-w-4xl mx-auto p-6 space-x-4">
            {/* Show the left side (connected users) immediately after username is set */}
            {isUsernameSet && (
                <div className="w-1/4 bg-gray-100 p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Connected Users</h2>
                    <ul className="space-y-2">
                        {connectedUsers.map((user, index) => (
                            <li key={index} className="text-lg text-green-600">
                                {user.username} (online)
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Right side for chat messages */}
            <div className="w-3/4">
                {!isUsernameSet ? (
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-semibold">Enter your username</h2>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="px-4 py-2 border border-gray-300 rounded-lg w-full"
                        />
                        <button
                            onClick={handleSetUsername}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            disabled={!isWsConnected} // Disable the button if the WebSocket is not connected
                        >
                            Set Username
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h1 className="text-3xl font-semibold text-center">Real-time Chat</h1>
                        <div className="h-64 overflow-y-auto bg-gray-100 p-4 rounded-lg shadow">
                            {messages.map((msg, index) => {
                                const { username, message } = msg;

                                // Determine if it's a system message about joining or leaving the chat
                                let messageStyle = { color: 'black' }; // Default message style
                                let usernameStyle = { color: 'blue' }; // Default color for usernames (users)

                                if (username === 'System' && message.includes('joined')) {
                                    usernameStyle = { color: 'green', fontWeight: 'bold' }; // Green for system "joined" messages
                                    messageStyle = { color: 'green', fontWeight: 'bold' };
                                } else if (username === 'System' && message.includes('left')) {
                                    usernameStyle = { color: 'red', fontWeight: 'bold' }; // Red for system "left" messages
                                    messageStyle = { color: 'red', fontWeight: 'bold' };
                                }

                                return (
                                    <p key={index} className="mb-2">
                                        <strong style={usernameStyle}>{username}:</strong>{' '}
                                        <span style={messageStyle}>{message}</span>
                                    </p>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress} // Send message on Enter key press
                                placeholder="Type a message"
                                className="px-4 py-2 border border-gray-300 rounded-lg w-full"
                            />
                            <button
                                onClick={sendMessage}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                disabled={!isWsConnected} // Disable the button if WebSocket is not connected
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;

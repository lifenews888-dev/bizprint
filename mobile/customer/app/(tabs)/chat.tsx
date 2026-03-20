import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  time: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'BizPrint-д тавтай морил! Тусламж хэрэгтэй юу? Бидэнтэй чатлаарай.',
    sender: 'system',
    time: '',
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
      time: timeStr,
    };

    const autoReply: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Баярлалаа! Таны мессежийг хүлээн авлаа. Удахгүй хариу өгөх болно.',
      sender: 'system',
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg, autoReply]);
    setInput('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[s.msgRow, isUser && s.msgRowUser]}>
        <View style={[s.msgBubble, isUser ? s.msgBubbleUser : s.msgBubbleSystem]}>
          <Text style={[s.msgText, isUser && s.msgTextUser]}>{item.text}</Text>
          {item.time ? (
            <Text style={s.msgTime}>{item.time}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.messageList}
      />

      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          placeholder="Мессеж бичих..."
          placeholderTextColor="#666"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
          <Text style={s.sendBtnText}>{'\u27A4'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  messageList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 12, alignItems: 'flex-start' },
  msgRowUser: { alignItems: 'flex-end' },
  msgBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  msgBubbleSystem: {
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderTopLeftRadius: 4,
  },
  msgBubbleUser: {
    backgroundColor: '#FF6B00',
    borderTopRightRadius: 4,
  },
  msgText: { fontSize: 14, color: '#F1F5F9', lineHeight: 20 },
  msgTextUser: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#888', marginTop: 4, alignSelf: 'flex-end' },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F1F5F9',
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { fontSize: 18, color: '#fff' },
});

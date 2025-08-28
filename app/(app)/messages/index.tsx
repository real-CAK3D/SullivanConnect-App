
import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, commonStyles } from '../../../styles/commonStyles';
import Button from '../../../components/Button';
import { useAppState } from '../../../store/AppStateContext';

export default function MessagesScreen() {
  const { accounts, currentAccount, messages, sendMessage, markMessageRead } = useAppState();
  const others = useMemo(() => accounts.filter((a) => a.id !== currentAccount?.id), [accounts, currentAccount]);

  const [activeId, setActiveId] = useState<string | null>(others[0]?.id || null);
  const [content, setContent] = useState('');

  const thread = useMemo(() => {
    if (!currentAccount || !activeId) return [];
    return messages
      .filter((m) => (m.fromAccountId === currentAccount.id && m.toAccountId === activeId) || (m.fromAccountId === activeId && m.toAccountId === currentAccount.id))
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [messages, currentAccount, activeId]);

  const activeUser = useMemo(() => others.find((o) => o.id === activeId) || null, [others, activeId]);

  const handleSend = () => {
    if (!activeId || !content.trim()) return;
    sendMessage(activeId, content.trim());
    setContent('');
  };

  return (
    <KeyboardAvoidingView style={[commonStyles.container, { alignItems: 'stretch' }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        <View style={[commonStyles.card]}>
          <Text style={[commonStyles.label]}>Select a teammate</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
            {others.map((o) => {
              const active = activeId === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => setActiveId(o.id)}
                  style={[styles.pill, { backgroundColor: active ? colors.primary : colors.card }]}
                >
                  <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{o.name} ({o.role})</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {!activeUser ? (
              <Text style={[commonStyles.smallText, { textAlign: 'center' }]}>Pick a teammate to start chatting.</Text>
            ) : (
              <>
                <Text style={[commonStyles.smallText, { marginBottom: 8 }]}>Chat with {activeUser.name}</Text>
                {thread.length === 0 ? <Text style={[commonStyles.smallText]}>No messages yet.</Text> : null}
                {thread.map((m) => {
                  const mine = currentAccount && m.fromAccountId === currentAccount.id;
                  return (
                    <View
                      key={m.id}
                      style={[
                        styles.msgBubble,
                        { alignSelf: mine ? 'flex-end' : 'flex-start', backgroundColor: mine ? colors.primary : colors.card },
                      ]}
                      onLayout={() => {
                        if (!mine && !m.readAt) markMessageRead(m.id);
                      }}
                    >
                      <Text style={{ color: mine ? '#fff' : colors.text }}>{m.content}</Text>
                      <Text style={[commonStyles.smallText, { marginTop: 4, color: mine ? '#fff' : colors.grey }]}>
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={activeUser ? `Message ${activeUser.name}` : 'Select a teammate first'}
            placeholderTextColor="#9CA3AF"
            style={commonStyles.input}
          />
          <Button text="Send" onPress={handleSend} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginVertical: 6,
    boxShadow: '0px 8px 14px rgba(0, 0, 0, 0.06)',
  } as any,
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 12,
    padding: 10,
    marginVertical: 6,
    boxShadow: '0px 8px 14px rgba(0, 0, 0, 0.06)',
  } as any,
});

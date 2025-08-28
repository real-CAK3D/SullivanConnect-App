
import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { buttonStyles, colors, commonStyles } from '../../../styles/commonStyles';
import Button from '../../../components/Button';
import { useAppState } from '../../../store/AppStateContext';
import ProgressDonut from '../../../components/ProgressDonut';

const categories = ['Store', 'General Service', 'Diag', 'Alignments', 'Electrical', 'Mechanic'];

export default function InventoryScreen() {
  const router = useRouter();
  const { items, role, deleteItem, updateStock, createRequest } = useAppState();
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const passCat = selectedCategory === 'All' ? true : it.category === selectedCategory;
      const passSearch = !search
        ? true
        : it.name.toLowerCase().includes(search.toLowerCase()) ||
          (it.description || '').toLowerCase().includes(search.toLowerCase());
      return passCat && passSearch;
    });
  }, [items, selectedCategory, search]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={commonStyles.row}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
          {(['All', ...categories] as const).map((c) => {
            const active = selectedCategory === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCategory(c)}
                style={[styles.catPill, { backgroundColor: active ? colors.primary : colors.card }]}
              >
                <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search items..."
        placeholderTextColor="#9CA3AF"
        style={[commonStyles.input, { marginTop: 12 }]}
      />

      <View style={[commonStyles.rowBetween, { marginTop: 8, marginBottom: 6 }]}>
        <Text style={[commonStyles.smallText, { fontWeight: '700' }]}>{filtered.length} items</Text>
        <Button
          text="Add Item"
          onPress={() => router.push('/(app)/inventory/edit')}
          style={{ paddingHorizontal: 16, width: 'auto', backgroundColor: colors.secondary } as any}
          textStyle={{ color: colors.text }}
        />
      </View>

      {filtered.map((it) => {
        const pct = it.initialStock > 0 ? Math.min(100, Math.round((it.currentStock / it.initialStock) * 100)) : 0;
        const status =
          it.currentStock === 0
            ? 'Empty'
            : pct < 30
            ? 'Low'
            : pct < 70
            ? 'Medium'
            : 'Full';

        return (
          <View key={it.id} style={[commonStyles.card, { overflow: 'hidden' }]}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 70, alignItems: 'center', justifyContent: 'center' }}>
                <ProgressDonut size={56} thickness={9} percent={pct} color={status === 'Low' || status === 'Empty' ? colors.danger : colors.accent} />
                <Text style={[commonStyles.smallText, { marginTop: 6, fontWeight: '700' }]}>{status}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={commonStyles.rowBetween}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{it.name}</Text>
                  <Text style={[commonStyles.tag]}>{it.category}</Text>
                </View>
                <Text style={[commonStyles.smallText, { marginTop: 2 }]} numberOfLines={2}>
                  {it.description || 'No description'}
                </Text>
                <Text style={[commonStyles.smallText, { marginTop: 6 }]}>
                  Stock: {it.currentStock} / {it.initialStock}
                </Text>
                {it.imageUri ? (
                  <Image source={{ uri: it.imageUri }} style={{ width: '100%', height: 140, borderRadius: 12, marginTop: 10 }} resizeMode="cover" />
                ) : null}

                <View style={[commonStyles.rowBetween, { marginTop: 12 }]}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.squareBtn, { backgroundColor: colors.card }]}
                      onPress={() => {
                        // Quick -1 to simulate usage
                        const newStock = Math.max(0, it.currentStock - 1);
                        updateStock(it.id, newStock);
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '800' }}>-1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.squareBtn, { backgroundColor: colors.card }]}
                      onPress={() => {
                        const newStock = Math.min(999999, it.currentStock + 1);
                        updateStock(it.id, newStock);
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '800' }}>+1</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button
                      text="Edit"
                      onPress={() => {
                        router.push({ pathname: '/(app)/inventory/edit', params: { id: it.id } });
                      }}
                      style={{ width: 'auto', paddingHorizontal: 16 } as any}
                    />
                    <Button
                      text="Delete"
                      onPress={() => deleteItem(it.id)}
                      style={[buttonStyles.dangerButton, { width: 'auto', paddingHorizontal: 16 } as any]}
                    />
                  </View>
                </View>

                <View style={[commonStyles.rowBetween, { marginTop: 10 }]}>
                  <Button
                    text="Request Restock"
                    onPress={() => createRequest({ itemId: it.id, quantity: Math.max(1, Math.ceil(it.initialStock * 0.5)), immediate: false })}
                    style={{ width: 'auto', paddingHorizontal: 16 } as any}
                  />
                  <Button
                    text="Immediate Request"
                    onPress={() => createRequest({ itemId: it.id, quantity: Math.max(1, Math.ceil(it.initialStock * 0.3)), immediate: true })}
                    style={{ width: 'auto', paddingHorizontal: 16, backgroundColor: colors.warning } as any}
                  />
                </View>
              </View>
            </View>
          </View>
        );
      })}

      {filtered.length === 0 ? (
        <Text style={[commonStyles.smallText, { textAlign: 'center', marginTop: 20 }]}>No items yet.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginVertical: 6,
    boxShadow: '0px 8px 14px rgba(0, 0, 0, 0.06)',
  } as any,
  squareBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 8px 14px rgba(0, 0, 0, 0.06)',
  } as any,
});

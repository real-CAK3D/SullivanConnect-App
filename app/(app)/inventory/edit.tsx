
import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { buttonStyles, colors, commonStyles } from '../../../styles/commonStyles';
import Button from '../../../components/Button';
import { useAppState } from '../../../store/AppStateContext';

const categories = ['Store', 'General Service', 'Diag', 'Alignments', 'Electrical', 'Mechanic'];

export default function EditItem() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { items, addItem, updateItem } = useAppState();

  const existing = items.find((x) => x.id === id);

  const [name, setName] = useState(existing?.name || '');
  const [desc, setDesc] = useState(existing?.description || '');
  const [category, setCategory] = useState(existing?.category || categories[0]);
  const [initialStock, setInitialStock] = useState(String(existing?.initialStock || ''));
  const [currentStock, setCurrentStock] = useState(String(existing?.currentStock ?? ''));
  const [imageUri, setImageUri] = useState(existing?.imageUri || '');

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Media permission status', status);
    })();
  }, []);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      setImageUri(res.assets[0].uri);
    }
  };

  const save = () => {
    const parsedInitial = parseInt(initialStock || '0', 10);
    const parsedCurrent = currentStock === '' ? parsedInitial : parseInt(currentStock, 10);
    if (!name || isNaN(parsedInitial)) {
      console.log('Validation failed on save');
      return;
    }
    if (isEditing && existing) {
      updateItem(existing.id, {
        name,
        description: desc,
        category,
        initialStock: parsedInitial,
        currentStock: isNaN(parsedCurrent) ? 0 : parsedCurrent,
        imageUri,
      });
    } else {
      addItem({
        name,
        description: desc,
        category,
        initialStock: parsedInitial,
        currentStock: isNaN(parsedCurrent) ? parsedInitial : parsedCurrent,
        imageUri: imageUri || undefined,
      });
    }
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={[commonStyles.title, { textAlign: 'left' }]}>{isEditing ? 'Edit Item' : 'Add Item'}</Text>

      <Text style={commonStyles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="#9CA3AF" style={commonStyles.input} />

      <Text style={commonStyles.label}>Description</Text>
      <TextInput
        value={desc}
        onChangeText={setDesc}
        placeholder="Description"
        placeholderTextColor="#9CA3AF"
        style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]}
        multiline
      />

      <Text style={commonStyles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
        {categories.map((c) => {
          const active = c === category;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.catPill, { backgroundColor: active ? colors.primary : colors.card }]}
            >
              <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700' }}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={commonStyles.label}>Initial Stock</Text>
      <TextInput
        value={initialStock}
        onChangeText={setInitialStock}
        placeholder="e.g. 100"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        style={commonStyles.input}
      />

      <Text style={commonStyles.label}>Current Stock</Text>
      <TextInput
        value={currentStock}
        onChangeText={setCurrentStock}
        placeholder="leave empty to equal initial"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        style={commonStyles.input}
      />

      <Text style={commonStyles.label}>Image</Text>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 10 }} />
      ) : null}
      <Button text={imageUri ? 'Change Image' : 'Pick Image'} onPress={pickImage} style={{ width: 'auto' } as any} />

      <View style={{ height: 12 }} />

      <Button text="Save" onPress={save} />
      <View style={{ height: 10 }} />
      <Button text="Cancel" onPress={() => router.back()} style={buttonStyles.subtleButton} textStyle={{ color: colors.text }} />
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
});

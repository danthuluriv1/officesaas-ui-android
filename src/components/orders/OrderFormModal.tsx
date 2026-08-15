import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { Theme } from '../../theme';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { OrderService } from '../../api/orderService';
import { SelectorModal } from '../ui/SelectorModal';
import { DatePickerField } from '../ui/DatePickerField';
import type { Party, Product, Quotation, LineItem } from '../../types';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { AppAlertStatic } from '../ui/AppAlert';

interface OrderParty extends Party {
  address?: {
    latitude?: number;
    longitude?: number;
    addressLine1?: string;
    city?: string;
  };
}

interface OrderFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({ visible, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  
  const [orderType, setOrderType] = useState('Client'); // 'Client' or 'Vendor'
  const [parties, setParties] = useState<OrderParty[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ name: '', description: '', quantity: 1, rate: 0, taxPercentage: 0 }]);
  
  const [partySelectorOpen, setPartySelectorOpen] = useState(false);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [quotationSelectorOpen, setQuotationSelectorOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      const initData = async () => {
        try {
          const prods = await OrderService.getProducts();
          setProducts(prods);
        } catch(e) {}
      };
      initData();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      const loadParties = async () => {
        try {
          const pts = await OrderService.getParties(orderType as 'Client'|'Vendor');
          setParties(pts);
        } catch(e) {}
      };
      loadParties();
      setSelectedPartyId('');
      setQuotations([]);
      setSelectedQuotationId('');
    }
  }, [orderType, visible]);

  useEffect(() => {
    if (selectedPartyId && orderType === 'Client') {
      const loadQuotes = async () => {
        try {
          const qts = await OrderService.getApprovedQuotations(selectedPartyId);
          setQuotations(qts);
        } catch(e) {}
      };
      loadQuotes();
    } else {
      setQuotations([]);
      setSelectedQuotationId('');
    }
  }, [selectedPartyId, orderType]);

  const handleAddOrder = async () => {
    if (!isWalkIn && !selectedPartyId) {
      AppAlertStatic.alert('Validation Error', `Please select a ${orderType.toLowerCase()} or check "Is Walk-in".`);
      return;
    }
    if (isWalkIn && !walkInName) {
      AppAlertStatic.alert('Validation Error', 'Please enter a custom name for the walk-in order.');
      return;
    }
    if (items.length === 0) {
      AppAlertStatic.alert('Validation Error', 'Please add at least one item.');
      return;
    }
    const invalidItems = items.some(i => !i.description || i.quantity <= 0 || i.rate < 0);
    if (invalidItems) {
      AppAlertStatic.alert('Validation Error', 'Please ensure all items have a description, valid quantity, and rate.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedParty = parties.find(p => p.entityId === selectedPartyId);
      
      const payload = {
        orderType,
        associatedPartyEntityId: isWalkIn ? null : selectedPartyId,
        partyNameSnapshot: isWalkIn ? walkInName : (selectedParty?.companyName || 'Unknown Party'),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        items: items.map(i => ({
          name: i.name,
          description: i.description,
          hsN_SAC_Code: i.hsN_SAC_Code || '',
          quantity: i.quantity,
          rate: i.rate,
          taxPercentage: i.taxPercentage
        })),
        status: 0,
        paymentStatus: 0,
        termsAndConditions: terms
      };

      await OrderService.createOrder(payload);
      AppAlertStatic.alert('Success', 'Order created successfully!');
      onClose();
      // Reset form
      setOrderType('Client');
      setSelectedPartyId('');
      setIsWalkIn(false);
      setWalkInName('');
      setSelectedQuotationId('');
      setItems([{ name: '', description: '', quantity: 1, rate: 0, taxPercentage: 0 }]);
      setTerms('');
      onSuccess();
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.response?.data?.message || err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const addItemRow = () => setItems([...items, { name: '', description: '', quantity: 1, rate: 0, taxPercentage: 0 }]);
  const updateItem = (index: number, field: keyof LineItem, val: string | number) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: val };
      return newItems;
    });
  };
  const removeItemRow = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const applyQuotation = (quotation: Quotation) => {
    setSelectedQuotationId(quotation.entityId);
    if (quotation.items && quotation.items.length > 0) {
      const newItems = quotation.items.map(i => {
        return {
          name: i.name || '',
          description: i.description || '',
          hsN_SAC_Code: i.hsN_SAC_Code || '',
          quantity: i.quantity || 1,
          rate: i.rate || 0,
          taxPercentage: i.taxPercentage || 0
        };
      });
      setItems(newItems);
    }
  };

  const applyProductToRow = (product: Product, index: number) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { 
        ...newItems[index], 
        name: product.name, 
        description: product.description || product.name,
        rate: product.sellingPrice
      };
      return newItems;
    });
  };

  return (
    <View>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Order</Text>
              <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Cancel</Text></TouchableOpacity>
            </View>

            <Text style={styles.sectionTitleModal}>Basic Details</Text>
            
            <Text style={styles.inputLabel}>Order Type</Text>
            <View style={styles.roleContainer}>
              {['Client', 'Vendor'].map(t => (
                <TouchableOpacity 
                  key={t} 
                  style={[styles.roleBtn, orderType === t && styles.roleBtnActive]}
                  onPress={() => { setOrderType(t); setSelectedPartyId(''); }}
                >
                  <Text style={[styles.roleBtnText, orderType === t && styles.roleBtnTextActive]}>{t} Order</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.row, { alignItems: 'center', marginVertical: 12 }]}>
              <TouchableOpacity 
                style={[styles.checkbox, isWalkIn && styles.checkboxActive]} 
                onPress={() => setIsWalkIn(!isWalkIn)}
              >
                {isWalkIn && <Text style={styles.checkboxCheck}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Custom Walk-in / One-time Order</Text>
            </View>

            {isWalkIn ? (
              <View>
                <Text style={styles.inputLabel}>Custom Name *</Text>
                <TextInput style={styles.input} value={walkInName} onChangeText={setWalkInName} placeholder="e.g. John Doe (Walk-in)" />
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>Select {orderType} *</Text>
                <TouchableOpacity style={styles.dropdownBtn} onPress={() => setPartySelectorOpen(true)}>
                  <Text style={styles.dropdownBtnText}>
                    {parties.find(p => p.entityId === selectedPartyId)?.companyName || `Select ${orderType}...`}
                  </Text>
                </TouchableOpacity>

                {/* GPS Coordinates and Mini-Map indicator */}
                {(() => {
                  const selParty = parties.find(p => p.entityId === selectedPartyId);
                  if (!selParty) return null;
                  
                  const hasCoords = selParty.address?.latitude && selParty.address?.longitude;
                  
                  if (!hasCoords) {
                    return (
                      <View style={styles.warnCard}>
                        <Text style={styles.warnCardText}>
                          ⚠️ Delivery coordinates are not configured for this {orderType.toLowerCase()}. 
                          Transportation routing solver will bypass this destination stop. 
                          Update client/vendor location settings to enable maps.
                        </Text>
                      </View>
                    );
                  }

                  const lat = selParty.address!.latitude!;
                  const lng = selParty.address!.longitude!;

                  return (
                    <View style={styles.gpsPreviewContainer}>
                      <Text style={styles.gpsCoordsLabel}>📍 Delivery GPS: {lat.toFixed(5)}, {lng.toFixed(5)}</Text>
                      <View style={styles.miniMapFrame}>
                        <MapView
                          provider={PROVIDER_DEFAULT}
                          style={styles.miniMap}
                          initialRegion={{
                            latitude: lat,
                            longitude: lng,
                            latitudeDelta: 0.015,
                            longitudeDelta: 0.015,
                          }}
                          scrollEnabled={false}
                          zoomEnabled={false}
                        >
                          <Marker coordinate={{ latitude: lat, longitude: lng }} />
                        </MapView>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}

            {!isWalkIn && quotations.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.inputLabel}>Apply Approved Quotation (Optional)</Text>
                <TouchableOpacity style={styles.dropdownBtn} onPress={() => setQuotationSelectorOpen(true)}>
                  <Text style={styles.dropdownBtnText}>
                    {quotations.find(q => q.entityId === selectedQuotationId)?.quotationNumber || `Select Quotation to populate items...`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.row, { marginTop: 16 }]}>
              <View style={styles.col}>
                <DatePickerField
                  label="START DATE *"
                  date={new Date(startDate)}
                  onChange={(d) => setStartDate(d.toISOString().substring(0, 10))}
                />
              </View>
              <View style={styles.col}>
                <DatePickerField
                  label="END DATE *"
                  date={new Date(endDate)}
                  onChange={(d) => setEndDate(d.toISOString().substring(0, 10))}
                />
              </View>
            </View>

            <View style={styles.bomHeaderContainer}>
              <Text style={[styles.sectionTitleModal, { marginBottom: 0, borderBottomWidth: 0, paddingBottom: 0 }]}>Line Items</Text>
              <TouchableOpacity onPress={addItemRow}>
                <Text style={styles.addBomText}>+ Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.map((row, idx) => (
              <View key={idx} style={styles.bomRow}>
                <View style={[styles.row, { marginBottom: 8 }]}>
                  <View style={[styles.col, { flex: 1.5 }]}>
                    <Text style={styles.inputLabel}>Name *</Text>
                    <TextInput style={styles.input} value={row.name} onChangeText={(v) => updateItem(idx, 'name', v)} placeholder="Item Name..." />
                  </View>
                  <View style={[styles.col, { flex: 2 }]}>
                    <Text style={styles.inputLabel}>Description *</Text>
                    <TextInput style={styles.input} value={row.description} onChangeText={(v) => updateItem(idx, 'description', v)} placeholder="Item desc..." />
                  </View>
                  <View style={{ justifyContent: 'flex-end', paddingBottom: 4 }}>
                    <TouchableOpacity 
                      style={styles.pickProductBtn}
                      onPress={() => {
                        setActiveItemIndex(idx);
                        setProductSelectorOpen(true);
                      }}
                    >
                      <Text style={styles.pickProductText}>Pick</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>Rate (₹) *</Text>
                    <TextInput style={styles.input} value={row.rate || row.rate === 0 ? row.rate.toString() : ''} onChangeText={(v) => updateItem(idx, 'rate', parseFloat(v) || 0)} keyboardType="numeric" placeholder="0" />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>Qty *</Text>
                    <TextInput style={styles.input} value={row.quantity ? row.quantity.toString() : ''} onChangeText={(v) => updateItem(idx, 'quantity', parseFloat(v) || 0)} keyboardType="numeric" placeholder="1" />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>Tax (%)</Text>
                    <TextInput style={styles.input} value={row.taxPercentage || row.taxPercentage === 0 ? row.taxPercentage.toString() : ''} onChangeText={(v) => updateItem(idx, 'taxPercentage', parseFloat(v) || 0)} keyboardType="numeric" placeholder="0" />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
                   <TouchableOpacity style={styles.deleteBomBtn} onPress={() => removeItemRow(idx)}>
                      <Text style={styles.deleteBomText}>Remove Item</Text>
                   </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitleModal, { marginTop: 24 }]}>Additional Details</Text>
            <Text style={styles.inputLabel}>Terms & Conditions</Text>
            <TextInput style={styles.input} value={terms} onChangeText={setTerms} placeholder="Enter terms..." multiline numberOfLines={3} />

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddOrder} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Order</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>

      <SelectorModal 
        visible={partySelectorOpen} 
        title={`Select ${orderType}`}
        items={parties} 
        displayKey="companyName"
        onSelect={(item: Party) => {
          setSelectedPartyId(item.entityId);
          setPartySelectorOpen(false);
        }} 
        onClose={() => setPartySelectorOpen(false)} 
      />
      <SelectorModal 
        visible={productSelectorOpen} 
        title="Select Product"
        items={products} 
        displayKey="name"
        onSelect={(item: Product) => {
          if (activeItemIndex !== null) {
            applyProductToRow(item, activeItemIndex);
          }
          setProductSelectorOpen(false);
        }} 
        onClose={() => setProductSelectorOpen(false)} 
      />
      <SelectorModal 
        visible={quotationSelectorOpen} 
        title="Select Approved Quotation"
        items={quotations} 
        displayKey="quotationNumber"
        onSelect={(item: Quotation) => {
          applyQuotation(item);
          setQuotationSelectorOpen(false);
        }} 
        onClose={() => setQuotationSelectorOpen(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitleModal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  roleBtnActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  roleBtnText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: '#1D4ED8',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500'
  },
  dropdownBtn: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  dropdownBtnText: {
    fontSize: 14,
    color: '#111827',
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  bomHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  addBomText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  bomRow: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  pickProductBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pickProductText: {
    color: '#1D4ED8',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteBomBtn: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  deleteBomText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  warnCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  warnCardText: {
    color: '#B45309',
    fontSize: 13,
    lineHeight: 18,
  },
  gpsPreviewContainer: {
    marginTop: 12,
  },
  gpsCoordsLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 6,
  },
  miniMapFrame: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  miniMap: {
    ...StyleSheet.absoluteFill,
  }
});

// import { useEffect, useState } from 'react';
// import { supabase } from '../lib/supabase';

// type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

// type Order = {
//   id: string | number;
//   status: OrderStatus;
//   total_amount?: number | null;
//   total?: number | null;
//   created_at?: string | null;
//   completed_at?: string | null;
//   cancelled_at?: string | null;
// };

// type OrdersPageProps = {
//   goBack?: () => void;
// };

// export default function OrdersPage({ goBack }: OrdersPageProps) {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadOrders();
//   }, []);

//   async function loadOrders() {
//     setLoading(true);

//     const { data, error } = await supabase
//       .from('orders')
//       .select('*')
//       .order('created_at', { ascending: false });

//     if (error) {
//       console.error('Orders laden mislukt:', error);
//       alert('Orders laden mislukt');
//       setLoading(false);
//       return;
//     }

//     setOrders(data ?? []);
//     setLoading(false);
//   }

//   async function updateOrderStatus(orderId: string | number, nextStatus: OrderStatus) {
//     const updateData: Partial<Order> & { updated_at: string } = {
//       status: nextStatus,
//       updated_at: new Date().toISOString(),
//     };

//     if (nextStatus === 'completed') {
//       updateData.completed_at = new Date().toISOString();
//     }

//     if (nextStatus === 'cancelled') {
//       updateData.cancelled_at = new Date().toISOString();
//     }

//     const { error } = await supabase
//       .from('orders')
//       .update(updateData)
//       .eq('id', orderId);

//     if (error) {
//       console.error('Order status aanpassen mislukt:', error);
//       alert('Order status aanpassen mislukt');
//       return;
//     }

//     await loadOrders();
//   }

//   function getTotal(order: Order) {
//     return Number(order.total_amount ?? order.total ?? 0).toFixed(2);
//   }

//   function getCreatedTime(order: Order) {
//     if (!order.created_at) return '-';

//     return new Date(order.created_at).toLocaleString('nl-NL', {
//       dateStyle: 'short',
//       timeStyle: 'short',
//     });
//   }

//   return (
//     <div style={styles.page}>
//       <div style={styles.header}>
//         <div>
//           <h1 style={styles.title}>Orders overzicht</h1>
//           <p style={styles.subtitle}>Bekijk en update de status van bestellingen.</p>
//         </div>

//         <div style={styles.headerButtons}>
//           <button style={styles.secondaryButton} onClick={loadOrders}>
//             Refresh
//           </button>

//           {goBack && (
//             <button style={styles.secondaryButton} onClick={goBack}>
//               Terug
//             </button>
//           )}
//         </div>
//       </div>

//       {loading && <p>Laden...</p>}

//       {!loading && orders.length === 0 && (
//         <div style={styles.emptyBox}>
//           <p style={styles.emptyTitle}>Geen orders gevonden</p>
//           <p style={styles.text}>Plaats eerst een bestelling in je POS.</p>
//         </div>
//       )}

//       <div style={styles.list}>
//         {orders.map((order) => (
//           <div key={String(order.id)} style={styles.card}>
//             <div style={styles.cardTop}>
//               <div>
//                 <h2 style={styles.orderTitle}>Order #{String(order.id)}</h2>
//                 <p style={styles.text}>{getCreatedTime(order)}</p>
//               </div>

//               <span style={styles.status}>{order.status}</span>
//             </div>

//             <p style={styles.total}>€ {getTotal(order)}</p>

//             <div style={styles.buttonRow}>
//               {order.status === 'new' && (
//                 <button
//                   style={styles.orangeButton}
//                   onClick={() => updateOrderStatus(order.id, 'preparing')}
//                 >
//                   Start bereiden
//                 </button>
//               )}

//               {order.status === 'preparing' && (
//                 <button
//                   style={styles.blueButton}
//                   onClick={() => updateOrderStatus(order.id, 'ready')}
//                 >
//                   Klaar voor pickup
//                 </button>
//               )}

//               {order.status === 'ready' && (
//                 <button
//                   style={styles.greenButton}
//                   onClick={() => updateOrderStatus(order.id, 'completed')}
//                 >
//                   Afgerond
//                 </button>
//               )}

//               {order.status !== 'completed' && order.status !== 'cancelled' && (
//                 <button
//                   style={styles.dangerButton}
//                   onClick={() => updateOrderStatus(order.id, 'cancelled')}
//                 >
//                   Annuleer
//                 </button>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// const styles: Record<string, React.CSSProperties> = {
//   page: {
//     minHeight: '100vh',
//     padding: 24,
//     background: '#f7f2ea',
//     color: '#222',
//     fontFamily: 'Arial, sans-serif',
//   },
//   header: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     gap: 16,
//     marginBottom: 24,
//   },
//   headerButtons: {
//     display: 'flex',
//     gap: 8,
//   },
//   title: {
//     margin: 0,
//     fontSize: 32,
//   },
//   subtitle: {
//     margin: '6px 0 0 0',
//     color: '#666',
//   },
//   emptyBox: {
//     padding: 24,
//     borderRadius: 16,
//     background: '#fff',
//     border: '1px solid #ddd',
//   },
//   emptyTitle: {
//     margin: 0,
//     fontSize: 20,
//     fontWeight: 700,
//   },
//   list: {
//     display: 'grid',
//     gap: 14,
//   },
//   card: {
//     padding: 18,
//     borderRadius: 16,
//     background: '#fff',
//     border: '1px solid #ddd',
//     boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//   },
//   cardTop: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     gap: 12,
//   },
//   orderTitle: {
//     margin: 0,
//     fontSize: 22,
//   },
//   text: {
//     margin: '6px 0 0 0',
//     color: '#666',
//   },
//   status: {
//     height: 'fit-content',
//     padding: '6px 10px',
//     borderRadius: 999,
//     background: '#eee',
//     fontSize: 12,
//     fontWeight: 700,
//     textTransform: 'uppercase',
//   },
//   total: {
//     margin: '14px 0',
//     fontSize: 20,
//     fontWeight: 700,
//   },
//   buttonRow: {
//     display: 'flex',
//     flexWrap: 'wrap',
//     gap: 8,
//   },
//   orangeButton: {
//     padding: '10px 12px',
//     borderRadius: 10,
//     border: 'none',
//     background: '#f5a623',
//     color: '#fff',
//     fontWeight: 700,
//     cursor: 'pointer',
//   },
//   blueButton: {
//     padding: '10px 12px',
//     borderRadius: 10,
//     border: 'none',
//     background: '#0D81FF',
//     color: '#fff',
//     fontWeight: 700,
//     cursor: 'pointer',
//   },
//   greenButton: {
//     padding: '10px 12px',
//     borderRadius: 10,
//     border: 'none',
//     background: '#28a745',
//     color: '#fff',
//     fontWeight: 700,
//     cursor: 'pointer',
//   },
//   dangerButton: {
//     padding: '10px 12px',
//     borderRadius: 10,
//     border: 'none',
//     background: '#d9534f',
//     color: '#fff',
//     fontWeight: 700,
//     cursor: 'pointer',
//   },
//   secondaryButton: {
//     padding: '10px 14px',
//     borderRadius: 10,
//     border: '1px solid #ccc',
//     background: '#fff',
//     color: '#222',
//     fontWeight: 700,
//     cursor: 'pointer',
//   },
// };
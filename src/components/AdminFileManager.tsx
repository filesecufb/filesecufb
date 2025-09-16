import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Search, Package, User, Car } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  client_id: string;
  status: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  total_price?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
  services?: {
    title?: string;
  };
}

interface AdminFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_category: 'map' | 'invoice';
  bucket_name?: string;
  order_id: string;
  uploaded_by: string;
  created_at: string;
}

const AdminFileManager: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminFiles, setAdminFiles] = useState<AdminFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'maps' | 'invoices'>('maps');

  // Cargar pedidos
  useEffect(() => {
    loadOrders();
  }, []);

  // Cargar archivos del admin cuando se selecciona un pedido
  useEffect(() => {
    if (selectedOrder) {
      loadAdminFiles(selectedOrder.id);
    }
  }, [selectedOrder]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          services (title),
          profiles!orders_client_id_fkey (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminFiles = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_files')
        .select('*')
        .eq('order_id', orderId)
        .eq('uploaded_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminFiles(data || []);
    } catch (err: any) {
      console.error('Error loading admin files:', err);
      toast.error('Error al cargar archivos del admin');
    }
  };

  const handleFileUpload = async (files: FileList | null, fileType: 'maps' | 'invoices') => {
    if (!files || files.length === 0 || !selectedOrder || !user) return;

    setUploading(true);
    const bucketName = fileType === 'maps' ? 'adminorders' : 'invoices';

    try {
      for (const file of Array.from(files)) {
        // Crear la ruta jerárquica: userId/orderId/archivo
        const filePath = `${selectedOrder.client_id}/${selectedOrder.id}/${file.name}`;

        // Subir archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        // Guardar información en la base de datos
        const { error: dbError } = await supabase
          .from('order_files')
          .insert({
            order_id: selectedOrder.id,
            client_id: selectedOrder.client_id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_category: fileType === 'maps' ? 'map' : 'invoice',
            uploaded_by: user.id,
            file_size: file.size
          });

        if (dbError) throw dbError;
      }

      toast.success(`${fileType === 'maps' ? 'Mapas tuneados' : 'Facturas'} subidos correctamente`);
      loadAdminFiles(selectedOrder.id);
    } catch (err: any) {
      console.error('Error uploading files:', err);
      toast.error(`Error al subir ${fileType === 'maps' ? 'mapas' : 'facturas'}: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (file: AdminFile) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) return;

    try {
      // Eliminar de Storage
      const filePath = `${selectedOrder?.client_id}/${selectedOrder?.id}/${file.file_name}`;
      const bucketName = file.file_category === 'map' ? 'adminorders' : 'invoices';
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (storageError) throw storageError;

      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('order_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast.success('Archivo eliminado correctamente');
      if (selectedOrder) {
        loadAdminFiles(selectedOrder.id);
      }
    } catch (err: any) {
      console.error('Error deleting file:', err);
      toast.error(`Error al eliminar archivo: ${err.message}`);
    }
  };

  const downloadFile = async (file: AdminFile) => {
    try {
      const filePath = `${selectedOrder?.client_id}/${selectedOrder?.id}/${file.file_name}`;
      const bucketName = file.file_category === 'map' ? 'adminorders' : 'invoices';
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) throw error;

      // Crear URL para descarga
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading file:', err);
      toast.error(`Error al descargar archivo: ${err.message}`);
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      order.profiles?.email?.toLowerCase().includes(searchLower) ||
      order.services?.title?.toLowerCase().includes(searchLower) ||
      `${order.vehicle_make} ${order.vehicle_model}`.toLowerCase().includes(searchLower)
    );
  });

  const filteredFiles = adminFiles.filter(file => {
    if (activeTab === 'maps') {
      return file.file_category === 'map';
    } else {
      return file.file_category === 'invoice';
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-white">{t('adminFileManager.loading.orders')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Gestión de Archivos del Admin</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Pedidos */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Seleccionar Pedido</h3>
          
          {/* Búsqueda */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente, ID o servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors text-sm"
            />
          </div>

          {/* Lista de Pedidos */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedOrder?.id === order.id
                    ? 'bg-primary/20 border-primary text-white'
                    : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">#{order.id.slice(-8).toUpperCase()}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm mb-1">
                  <User className="w-3 h-3" />
                  <span>{order.profiles?.full_name || 'Cliente no encontrado'}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm mb-1">
                  <Car className="w-3 h-3" />
                  <span>{order.vehicle_make} {order.vehicle_model} {order.vehicle_year}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Package className="w-3 h-3" />
                  <span>{order.services?.title || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Archivos */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          {selectedOrder ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Archivos - #{selectedOrder.id.slice(-8).toUpperCase()}
                </h3>
              </div>

              {/* Tabs */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setActiveTab('maps')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'maps'
                      ? 'bg-primary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Mapas Tuneados
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'invoices'
                      ? 'bg-primary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Facturas
                </button>
              </div>

              {/* Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subir {activeTab === 'maps' ? 'Mapas Tuneados' : 'Facturas'}
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept={activeTab === 'maps' ? '.bin,.hex,.ori,.mod' : '.pdf,.jpg,.jpeg,.png'}
                    onChange={(e) => handleFileUpload(e.target.files, activeTab)}
                    disabled={uploading}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">
                      {uploading ? t('adminFileManager.uploading') : `${t('adminFileManager.clickToUpload')} ${activeTab === 'maps' ? t('adminFileManager.maps') : t('adminFileManager.invoices')}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activeTab === 'maps' 
                        ? 'Formatos: .bin, .hex, .ori, .mod'
                        : 'Formatos: .pdf, .jpg, .jpeg, .png'
                      }
                    </p>
                  </label>
                </div>
              </div>

              {/* Files List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredFiles.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    No hay {activeTab === 'maps' ? 'mapas tuneados' : 'facturas'} subidos
                  </p>
                ) : (
                  filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-700/30 border border-gray-600 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-white text-sm font-medium">{file.file_name}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(file.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadFile(file)}
                          className="p-1 text-gray-400 hover:text-primary transition-colors"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFileDelete(file)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Selecciona un pedido para gestionar sus archivos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFileManager;
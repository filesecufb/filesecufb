import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Save, X, FolderOpen, Car, Truck, Wrench, Settings, Zap, Cog, Hammer, Gauge, Languages, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getIconComponent, availableIcons } from '../utils/iconUtils';
import { translateCategoryToEnglish } from '../lib/geminiTranslation.js';
import { useCategoryContext } from '../contexts/CategoryContext';

interface ServiceCategory {
  id: string;
  icon: string;
  title_part1: string;
  title_part2: string;
  subtitle: string;
  status: 'active' | 'inactive';
  sort_order: number;
  created_at: string;
  updated_at: string;
  translations?: {
    title_part1: string;
    title_part2: string;
    subtitle: string;
  };
}

interface CategoryFormData {
  icon: string;
  title_part1: string;
  title_part2: string;
  subtitle: string;
  status: 'active' | 'inactive';
}

const CategoryManager: React.FC = () => {
  const { t } = useTranslation();
  const { triggerRefresh } = useCategoryContext();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [translatingCategories, setTranslatingCategories] = useState<Set<string>>(new Set());
  const [editingTranslations, setEditingTranslations] = useState<Set<string>>(new Set());
  const [translationEdits, setTranslationEdits] = useState<Record<string, {
    title_part1: string;
    title_part2: string;
    subtitle: string;
  }>>({});
  const [formData, setFormData] = useState<CategoryFormData>({
    icon: 'Car',
    title_part1: '',
    title_part2: '',
    subtitle: '',
    status: 'active'
  });

  // Available Lucide icons
  const availableIcons = [
    { name: 'Car', component: Car },
    { name: 'Truck', component: Truck },
    { name: 'Wrench', component: Wrench },
    { name: 'Settings', component: Settings },
    { name: 'Zap', component: Zap },
    { name: 'Cog', component: Cog },
    { name: 'Hammer', component: Hammer },
    { name: 'Gauge', component: Gauge }
  ];

  // Get icon component by name
  const getIconComponent = (iconName: string) => {
    const icon = availableIcons.find(i => i.name === iconName);
    return icon ? icon.component : Car;
  };

  // Load categories from Supabase
  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      toast.error('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    // Convert to uppercase for title and subtitle fields
    const processedValue = ['title_part1', 'title_part2', 'subtitle'].includes(field) 
      ? value.toUpperCase() 
      : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.icon || !formData.title_part1 || !formData.title_part2 || !formData.subtitle) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('service_categories')
          .update({
            icon: formData.icon,
            title_part1: formData.title_part1.toUpperCase(),
            title_part2: formData.title_part2.toUpperCase(),
            subtitle: formData.subtitle.toUpperCase(),
            status: formData.status
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success(t('adminDashboard.categories.messages.updated'));
      } else {
        // Get the next sort_order value
        const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0;
        const nextOrder = maxOrder + 1;
        
        // Create new category
        const { error } = await supabase
          .from('service_categories')
          .insert({
            icon: formData.icon,
            title_part1: formData.title_part1.toUpperCase(),
            title_part2: formData.title_part2.toUpperCase(),
            subtitle: formData.subtitle.toUpperCase(),
            status: formData.status,
            sort_order: nextOrder
          });

        if (error) throw error;
        toast.success(t('adminDashboard.categories.messages.created'));
      }
      
      resetForm();
      loadCategories();
      console.log('🔄 CategoryManager: Triggering refresh after category save');
      triggerRefresh();
    } catch (err: any) {
      console.error('Error saving category:', err);
      toast.error(err.message || t('adminDashboard.categories.messages.error'));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      icon: 'Car',
      title_part1: '',
      title_part2: '',
      subtitle: '',
      status: 'active'
    });
    setEditingCategory(null);
    setIsFormOpen(false);
  };

  // Handle edit
  const handleEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    setFormData({
      icon: category.icon,
      title_part1: category.title_part1,
      title_part2: category.title_part2,
      subtitle: category.subtitle,
      status: category.status
    });
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm(t('adminDashboard.categories.confirmDelete'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('adminDashboard.categories.messages.deleteSuccess'));
      loadCategories();
      console.log('🔄 CategoryManager: Triggering refresh after category deletion');
      triggerRefresh();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast.error(t('adminDashboard.categories.messages.error'));
    }
  };

  // Handle move category
  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const currentOrder = category.sort_order;
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    
    // Find the category to swap with
    const targetCategory = categories.find(c => c.sort_order === targetOrder);
    if (!targetCategory) return;

    try {
      // Update both categories in a transaction-like manner
      const { error: error1 } = await supabase
        .from('service_categories')
        .update({ sort_order: targetOrder })
        .eq('id', categoryId);

      const { error: error2 } = await supabase
        .from('service_categories')
        .update({ sort_order: currentOrder })
        .eq('id', targetCategory.id);

      if (error1 || error2) {
        throw error1 || error2;
      }

      toast.success('Orden actualizado correctamente');
      loadCategories();
      console.log('🔄 CategoryManager: Triggering refresh after position update');
      triggerRefresh();
    } catch (err: any) {
      console.error('Error updating category order:', err);
      toast.error('Error al actualizar el orden');
    }
  };

  // Handle manual position change
  const handleManualPositionChange = async (categoryId: string, newPosition: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    // Validate position
    if (newPosition < 1 || newPosition > categories.length) {
      toast.error(`La posición debe estar entre 1 y ${categories.length}`);
      return;
    }

    const currentPosition = category.sort_order;
    if (currentPosition === newPosition) return;

    try {
      // Create a copy of categories to work with
      const updatedCategories = [...categories];
      
      // Remove the category from its current position
      const categoryToMove = updatedCategories.find(c => c.id === categoryId);
      if (!categoryToMove) return;
      
      // Reorganize positions
      if (newPosition < currentPosition) {
        // Moving up: shift categories down
        updatedCategories.forEach(cat => {
          if (cat.sort_order >= newPosition && cat.sort_order < currentPosition) {
            cat.sort_order += 1;
          }
        });
      } else {
        // Moving down: shift categories up
        updatedCategories.forEach(cat => {
          if (cat.sort_order > currentPosition && cat.sort_order <= newPosition) {
            cat.sort_order -= 1;
          }
        });
      }
      
      // Set the new position for the moved category
      categoryToMove.sort_order = newPosition;
      
      // Update all affected categories in the database
      const updatePromises = updatedCategories.map(cat => 
        supabase
          .from('service_categories')
          .update({ sort_order: cat.sort_order })
          .eq('id', cat.id)
      );
      
      const results = await Promise.all(updatePromises);
      const hasError = results.some(result => result.error);
      
      if (hasError) {
        throw new Error('Error al actualizar las posiciones');
      }
      
      toast.success('Posición actualizada correctamente');
      loadCategories();
      console.log('🔄 CategoryManager: Triggering refresh after position update');
      triggerRefresh();
    } catch (err: any) {
      console.error('Error updating manual position:', err);
      toast.error('Error al actualizar la posición');
    }
  };

  const handleTranslateToEnglish = async (category: ServiceCategory) => {
    console.log('🔄 Iniciando traducción para categoría:', category.id, category);
    console.log('🔑 API Key disponible:', !!import.meta.env.VITE_GEMINI_API_KEY);
    console.log('🔑 API Key (primeros 10 chars):', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10));
    
    if (translatingCategories.has(category.id)) {
      console.log('⚠️ Traducción ya en progreso para:', category.id);
      return;
    }
    
    setTranslatingCategories(prev => new Set(prev).add(category.id));
    console.log('✅ Estado de traducción actualizado, iniciando proceso...');
    
    try {
      console.log('📤 Enviando datos a translateCategoryToEnglish:', {
        title_part1: category.title_part1,
        title_part2: category.title_part2,
        subtitle: category.subtitle
      });
      
      console.log('🚀 Llamando a translateCategoryToEnglish...');
      const translations = await translateCategoryToEnglish({
        title_part1: category.title_part1,
        title_part2: category.title_part2,
        subtitle: category.subtitle
      });
      
      console.log('📥 Traducciones recibidas:', translations);
      
      console.log('💾 Actualizando base de datos...');
      const { data, error } = await supabase
        .from('service_categories')
        .update({ translations })
        .eq('id', category.id)
        .select();
        
      if (error) {
        console.error('❌ Error en base de datos:', error);
        throw error;
      }
      
      console.log('✅ Base de datos actualizada:', data);
      
      // Recargar categorías para mostrar las traducciones// Reload categories
      console.log('🔄 Recargando categorías...');
      await loadCategories();
      
      console.log('🎉 Traducción completada exitosamente');
      toast.success('Traducción completada exitosamente');
      console.log('🔄 CategoryManager: Triggering refresh after translation');
      triggerRefresh();
    } catch (error) {
      console.error('❌ Error completo en traducción:', error);
      console.error('❌ Stack trace:', error.stack);
      toast.error(`Error al traducir la categoría: ${error.message}`);
    } finally {
      console.log('🏁 Finalizando proceso - actualizando estado de traducción');
      setTranslatingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(category.id);
        console.log('🔄 Estado de traducción limpiado para:', category.id);
        return newSet;
      });
      console.log('🏁 Proceso de traducción finalizado');
    }
  };

  // Handle translation editing
  const handleEditTranslation = (categoryId: string, translations: any) => {
    setEditingTranslations(prev => new Set(prev).add(categoryId));
    setTranslationEdits(prev => ({
      ...prev,
      [categoryId]: {
        title_part1: translations.en?.title_part1 || '',
        title_part2: translations.en?.title_part2 || '',
        subtitle: translations.en?.subtitle || ''
      }
    }));
  };

  // Handle translation input change
  const handleTranslationInputChange = (categoryId: string, field: string, value: string) => {
    const processedValue = value.toUpperCase();
    setTranslationEdits(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: processedValue
      }
    }));
  };

  // Save translation edits
  const handleSaveTranslationEdits = async (categoryId: string) => {
    const edits = translationEdits[categoryId];
    if (!edits) return;

    try {
      const { error } = await supabase
        .from('service_categories')
        .update({ 
          translations: {
            en: {
              title_part1: edits.title_part1,
              title_part2: edits.title_part2,
              subtitle: edits.subtitle
            },
            manually_edited: true
          }
        })
        .eq('id', categoryId);

      if (error) throw error;

      toast.success('Traducción actualizada correctamente');
      
      // Remove from editing state
      setEditingTranslations(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
      
      // Remove from edits
      setTranslationEdits(prev => {
        const newEdits = { ...prev };
        delete newEdits[categoryId];
        return newEdits;
      });
      
      // Reload categories
      await loadCategories();
      console.log('🔄 CategoryManager: Triggering refresh after translation edit');
      triggerRefresh();
    } catch (error: any) {
      console.error('Error saving translation edits:', error);
      toast.error('Error al guardar la traducción');
    }
  };

  // Cancel translation editing
  const handleCancelTranslationEdit = (categoryId: string) => {
    setEditingTranslations(prev => {
      const newSet = new Set(prev);
      newSet.delete(categoryId);
      return newSet;
    });
    
    setTranslationEdits(prev => {
      const newEdits = { ...prev };
      delete newEdits[categoryId];
      return newEdits;
    });
  };

  // Revert to automatic translation
  const handleRevertToAutoTranslation = async (category: ServiceCategory) => {
    if (!confirm('¿Estás seguro de que quieres revertir a la traducción automática? Se perderán los cambios manuales.')) {
      return;
    }

    await handleTranslateToEnglish(category);
  };

  // Category preview component
  const CategoryPreview: React.FC<{ category: CategoryFormData }> = ({ category }) => {
    const IconComponent = getIconComponent(category.icon);
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-4">
            <IconComponent className="w-10 h-10 text-primary mr-3" />
            <h2 className="text-2xl md:text-3xl font-bold">
              <span className="text-white">{category.title_part1}</span> <span className="text-primary">{category.title_part2}</span>
            </h2>
          </div>
          <p className="text-gray-400 text-sm">
            {category.subtitle}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <FolderOpen className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white">
              {t('adminDashboard.categories.title')}
            </h2>
            <p className="text-gray-400 text-sm">
              Administra las categorías de servicios disponibles
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          <span>{t('adminDashboard.categories.createNew')}</span>
        </button>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('adminDashboard.categories.loading')}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{t('adminDashboard.categories.noCategories')}</p>
          <p className="text-gray-500 text-sm mt-2">Crea tu primera categoría para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            return (
              <div key={category.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300">
                {/* Category Preview */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center mb-4">
                    <IconComponent className="w-8 h-8 text-primary mr-3" />
                    <h3 className="text-xl font-bold">
                      <span className="text-white">{category.title_part1}</span> <span className="text-primary">{category.title_part2}</span>
                    </h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    {category.subtitle}
                  </p>
                </div>

              {/* Status Badge */}
              <div className="flex justify-center mb-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  category.status === 'active'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {category.status === 'active' ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              {/* Translations Display */}
              {category.translations && (
                <div className="mb-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-medium text-green-400">Traducción en Inglés:</h4>
                      {category.translations.manually_edited && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]" title="Traducción editada manualmente">
                          Manual
                        </span>
                      )}
                      {!category.translations.manually_edited && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded text-[10px]" title="Traducción automática">
                          Auto
                        </span>
                      )}
                    </div>
                    {!editingTranslations.has(category.id) && (
                      <button
                        onClick={() => handleEditTranslation(category.id, category.translations)}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                        title="Editar traducción"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  
                  {editingTranslations.has(category.id) ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={translationEdits[category.id]?.title_part1 || ''}
                          onChange={(e) => handleTranslationInputChange(category.id, 'title_part1', e.target.value)}
                          placeholder="TITLE PART 1"
                          className="text-xs px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        />
                        <input
                          type="text"
                          value={translationEdits[category.id]?.title_part2 || ''}
                          onChange={(e) => handleTranslationInputChange(category.id, 'title_part2', e.target.value)}
                          placeholder="TITLE PART 2"
                          className="text-xs px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <input
                        type="text"
                        value={translationEdits[category.id]?.subtitle || ''}
                        onChange={(e) => handleTranslationInputChange(category.id, 'subtitle', e.target.value)}
                        placeholder="SUBTITLE IN ENGLISH"
                        className="w-full text-xs px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      />
                      <div className="flex justify-between items-center mt-2">
                         <button
                           onClick={() => handleRevertToAutoTranslation(category.id)}
                           className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors"
                           title="Revertir a traducción automática"
                         >
                           Revertir
                         </button>
                         <div className="flex space-x-1">
                           <button
                             onClick={() => handleCancelTranslationEdit(category.id)}
                             className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors"
                           >
                             Cancelar
                           </button>
                           <button
                             onClick={() => handleSaveTranslationEdits(category.id)}
                             className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-500 transition-colors"
                           >
                             Guardar
                           </button>
                         </div>
                       </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h3 className="text-sm font-bold">
                        <span className="text-white">{category.translations.title_part1}</span> <span className="text-primary">{category.translations.title_part2}</span>
                      </h3>
                      <p className="text-gray-300 text-xs mt-1">
                        {category.translations.subtitle}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Order Controls */}
              <div className="flex justify-center mb-3">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleMoveCategory(category.id, 'up')}
                    disabled={category.sort_order === 1}
                    className="p-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Subir categoría"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={categories.length}
                    value={category.sort_order}
                    onChange={(e) => {
                      const newPosition = parseInt(e.target.value);
                      if (!isNaN(newPosition)) {
                        handleManualPositionChange(category.id, newPosition);
                      }
                    }}
                    className="w-12 h-6 text-xs text-center bg-gray-700 border border-gray-600 rounded text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    title="Escribir posición manualmente"
                  />
                  <button
                    onClick={() => handleMoveCategory(category.id, 'down')}
                    disabled={category.sort_order === categories.length}
                    className="p-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Bajar categoría"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-1">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                  title={t('adminDashboard.categories.actions.edit')}
                >
                  <Edit className="w-3 h-3" />
                  <span className="text-xs">Editar</span>
                </button>
                <button
                  onClick={() => {
                    console.log('🖱️ CLICK EN BOTÓN DE TRADUCIR - EVENTO DETECTADO');
                    console.log('📋 Categoría seleccionada:', category);
                    handleTranslateToEnglish(category);
                  }}
                  disabled={translatingCategories.has(category.id)}
                  className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Traducir al Inglés"
                >
                  {translatingCategories.has(category.id) ? (
                    <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Languages className="w-3 h-3" />
                  )}
                  <span className="text-xs">{translatingCategories.has(category.id) ? 'Traduciendo...' : 'Traducir'}</span>
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                  title={t('adminDashboard.categories.actions.delete')}
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-xs">Eliminar</span>
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingCategory ? t('adminDashboard.categories.editCategory') : t('adminDashboard.categories.createNew')}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Icono
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => handleInputChange('icon', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {availableIcons.map((icon) => {
                        const IconComponent = icon.component;
                        return (
                          <option key={icon.name} value={icon.name}>
                            {icon.name}
                          </option>
                        );
                      })}
                    </select>
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
                      <span>Vista previa:</span>
                      {React.createElement(getIconComponent(formData.icon), { className: "w-5 h-5 text-primary" })}
                      <span>{formData.icon}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('adminDashboard.categories.form.titlePart1')}
                      </label>
                      <input
                        type="text"
                        value={formData.title_part1}
                        onChange={(e) => handleInputChange('title_part1', e.target.value)}
                        placeholder="CAR"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('adminDashboard.categories.form.titlePart2')}
                      </label>
                      <input
                        type="text"
                        value={formData.title_part2}
                        onChange={(e) => handleInputChange('title_part2', e.target.value)}
                        placeholder="TUNING"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('adminDashboard.categories.form.subtitle')}
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => handleInputChange('subtitle', e.target.value)}
                      placeholder="AUTOMOTIVE TUNING SERVICES"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive')}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">{t('adminDashboard.categories.form.preview')}</h4>
                  <CategoryPreview category={formData} />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {t('adminDashboard.categories.form.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCategory ? t('adminDashboard.categories.form.update') : t('adminDashboard.categories.form.save')} Categoría</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
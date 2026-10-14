/** @fileoverview Renders the anime creation/editing modal dialog and trigger button. */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, Popup } from 'pixel-retroui';
import { useTheme } from '../../context/ThemeContext';
import { validateAnimeForm, sanitizeAnimeInput } from '../../lib/validators';
import AnimeFormFields from './AnimeFormFields';

/**
 * Modal dialog and trigger button for creating or editing anime entries.
 *
 * Steps:
 * 1. Synchronize form state when editAnime prop changes.
 * 2. Render trigger button to open modal in create mode.
 * 3. Render Popup modal container.
 * 4. Handle validation via validateAnimeForm before submission.
 * 5. Sanitize data via sanitizeAnimeInput and invoke onAdd or onEdit.
 * 6. Reset form state and close modal.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onAdd - Callback to add a new anime record.
 * @param {Function} props.onEdit - Callback to update an existing anime record.
 * @param {Object|null} props.editAnime - Anime record currently selected for editing.
 * @param {boolean} props.isEditMode - Whether modal was triggered in edit mode.
 * @returns {JSX.Element} Form modal and trigger element.
 */
export default function AnimeFormModal({ onAdd, onEdit, editAnime, isEditMode }) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalEpisodes: '',
    watchedEpisodes: '',
    completed: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && editAnime) {
      setFormData({
        name: editAnime.name || '',
        totalEpisodes: editAnime.totalEpisodes != null ? String(editAnime.totalEpisodes) : '',
        watchedEpisodes: editAnime.watchedEpisodes != null ? String(editAnime.watchedEpisodes) : '',
        completed: Boolean(editAnime.completed),
      });
      setIsOpen(true);
    }
  }, [isEditMode, editAnime]);

  const handleOpenForm = () => {
    setIsOpen(true);
    setErrors({});
    setFormData({
      name: '',
      totalEpisodes: '',
      watchedEpisodes: '',
      completed: false,
    });
  };

  const handleCloseForm = () => {
    setIsOpen(false);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateAnimeForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const sanitizedData = sanitizeAnimeInput(formData);

    if (isEditMode && editAnime) {
      await onEdit(editAnime.id, sanitizedData);
    } else {
      await onAdd(sanitizedData);
    }

    setFormData({
      name: '',
      totalEpisodes: '',
      watchedEpisodes: '',
      completed: false,
    });
    setErrors({});
    setIsSubmitting(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={handleOpenForm}
          bg={theme.bg}
          textColor={theme.textColor}
          borderColor={theme.borderColor}
          shadow={theme.borderColor}
          className="px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base uppercase tracking-wide font-black border-2"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <span>➕</span> <span className="hidden xs:inline">Add</span> Anime
          </motion.span>
        </Button>
      </motion.div>

      {/* Modal Popup Container */}
      <Popup
        isOpen={isOpen}
        onClose={handleCloseForm}
        title={isEditMode ? 'Edit Anime' : 'Add Anime'}
        bg={theme.bg}
        textColor={theme.textColor}
        borderColor={theme.borderColor}
        baseBg={theme.bg}
        overlayBg={`${theme.bg}CC`}
        className="max-w-lg"
      >
        <AnimeFormFields
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          isSubmitting={isSubmitting}
          isEditMode={isEditMode}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          theme={theme}
        />
      </Popup>
    </>
  );
}

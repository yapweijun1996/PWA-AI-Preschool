import { placeholderPhoto } from '../portfolio-seed.js';
import { fileToDataUri } from '../photo.js';
import { el, button } from './ui.js';

export function photoControls(ctx, record, id) {
  const root = el('section', undefined, 'editor-photo-controls');
  const photos = el('div', undefined, 'photos editor-photos');
  const entry = record.domains[id];
  const state = { pending: false, disposed: false };
  const changed = () => ctx.change(record);
  const upload = uploadControls(ctx, record, id, state, src => {
    if (state.disposed || state.pending || entry.photos.length >= 6) return;
    state.pending = true;
    upload.update();
    const pending = pendingPhoto(src, photo => {
      entry.photos.push(photo);
      changed();
      finish();
    }, finish);
    photos.append(pending.root);
    pending.focus();
    ctx.announce('Image not saved until alt text is entered and Save photo is selected.');
  });
  function finish() {
    state.pending = false;
    photos.replaceChildren();
    for (const photo of entry.photos) {
      photos.append(savedPhoto(photo, () => {
        entry.photos = entry.photos.filter(item => item.id !== photo.id);
        changed();
        finish();
      }, changed));
    }
    upload.update();
  }
  const unsubscribe = ctx.subscribe(upload.update);
  root.dispose = () => {
    state.disposed = true;
    unsubscribe();
  };
  root.append(el('h3', 'Sample activity artifact'), photos, upload.root);
  finish();
  return root;
}

function uploadControls(ctx, record, id, state, add) {
  const root = el('details', undefined, 'editor-photo-actions');
  const compact = matchMedia('(max-width: 600px)');
  root.open = !compact.matches;
  root.append(el('summary', 'Add photo'));
  const label = el('label', 'Choose a local fictional image');
  const file = el('input');
  file.type = 'file';
  file.accept = 'image/*';
  label.append(file);
  const sample = button('Add sample placeholder photo', () => add(
    placeholderPhoto(`${record.childId}-${id}-${Date.now()}`, 'Fictional sample placeholder')));
  const update = () => {
    file.disabled = sample.disabled = ctx.busy || state.pending
      || record.domains[id].photos.length >= 6;
  };
  file.addEventListener('change', async () => {
    if (!file.files[0]) return;
    file.disabled = true;
    try { add(await fileToDataUri(file.files[0])); }
    catch (error) { ctx.announce(error.message); }
    finally {
      file.value = '';
      update();
    }
  });
  const localImage = el('details', undefined, 'editor-local-image');
  localImage.append(el('summary', 'Choose a local fictional image'), label);
  root.append(sample, localImage);
  return { root, update };
}

function pendingPhoto(src, save, cancel) {
  const root = el('figure', undefined, 'photo editor-photo-pending');
  const image = el('img');
  image.src = src;
  image.alt = 'Unsaved image preview';
  const altLabel = el('label', 'Required alt text before saving');
  const alt = el('input');
  alt.required = true;
  altLabel.append(alt);
  root.append(image, altLabel, button('Save photo', () => {
    if (!alt.value.trim()) {
      alt.setCustomValidity('Alt text is required.');
      alt.reportValidity();
      return;
    }
    save({ id: crypto.randomUUID(), src, alt: alt.value.trim() });
  }), button('Cancel image', cancel));
  alt.addEventListener('input', () => alt.setCustomValidity(''));
  return { root, focus: () => alt.focus() };
}

function savedPhoto(photo, remove, changed) {
  const figure = el('figure', undefined, 'photo editor-photo');
  const image = el('img');
  image.src = photo.src;
  image.alt = photo.alt;
  const caption = el('figcaption', photo.alt);
  const details = el('details', undefined, 'editor-photo-details');
  details.append(el('summary', 'Edit photo'));
  const label = el('label', 'Photo alt text');
  const alt = el('input');
  alt.required = true;
  alt.value = photo.alt;
  label.append(alt);
  alt.addEventListener('input', () => alt.setCustomValidity(''));
  alt.addEventListener('change', () => {
    if (!alt.value.trim()) {
      alt.setCustomValidity('Alt text is required.');
      alt.reportValidity();
      return;
    }
    photo.alt = alt.value.trim();
    image.alt = photo.alt;
    caption.textContent = photo.alt;
    changed();
  });
  details.append(label, button('Remove photo', remove));
  figure.append(image, caption, details);
  return figure;
}

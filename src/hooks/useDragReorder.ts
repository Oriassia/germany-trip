import { useEffect } from 'react';

interface DragReorderOptions {
  onReorderActivities: (
    dayId: string,
    fromId: string,
    toId: string,
    before: boolean,
  ) => void;
  onReorderDays: (fromId: string, toId: string, before: boolean) => void;
}

export function useDragReorder({
  onReorderActivities,
  onReorderDays,
}: DragReorderOptions) {
  useEffect(() => {
    let dndSrc: HTMLElement | null = null;
    let dndType: 'act' | 'day' | null = null;
    let pendingSrc: HTMLElement | null = null;
    let pendingType: 'act' | 'day' | null = null;

    const clearDnd = () => {
      document
        .querySelectorAll('.drag-over-top, .drag-over-bottom')
        .forEach((el) => {
          el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
    };

    const onMousedown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const actH = target.closest('.tl-handle');
      const dayH = target.closest('.day-drag-handle');
      if (actH) {
        pendingSrc = actH.closest('.act-wrapper') as HTMLElement | null;
        pendingType = 'act';
        pendingSrc?.setAttribute('draggable', 'true');
      } else if (dayH) {
        pendingSrc = dayH.closest('.day-card') as HTMLElement | null;
        pendingType = 'day';
        pendingSrc?.setAttribute('draggable', 'true');
      } else {
        pendingSrc = null;
        pendingType = null;
      }
    };

    const onMouseup = () => {
      if (pendingSrc) pendingSrc.removeAttribute('draggable');
      pendingSrc = null;
      pendingType = null;
    };

    const onDragstart = (e: DragEvent) => {
      if (!pendingSrc) {
        e.preventDefault();
        return;
      }
      dndSrc = pendingSrc;
      dndType = pendingType;
      dndSrc.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
      }
    };

    const onDragover = (e: DragEvent) => {
      if (!dndSrc) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

      const ZONE = 100;
      const dy =
        e.clientY < ZONE
          ? e.clientY - ZONE
          : e.clientY > window.innerHeight - ZONE
            ? e.clientY - (window.innerHeight - ZONE)
            : 0;
      if (dy) window.scrollBy({ top: dy * 0.3, behavior: 'instant' });

      clearDnd();
      const targetEl = e.target as HTMLElement;

      if (dndType === 'act') {
        const target = targetEl.closest('.act-wrapper') as HTMLElement | null;
        if (
          !target ||
          target === dndSrc ||
          target.dataset.dayid !== dndSrc.dataset.dayid
        )
          return;
        const rect = target.getBoundingClientRect();
        target.classList.add(
          e.clientY < rect.top + rect.height / 2
            ? 'drag-over-top'
            : 'drag-over-bottom',
        );
      } else {
        const target = targetEl.closest('.day-card') as HTMLElement | null;
        if (!target || target === dndSrc) return;
        const rect = target.getBoundingClientRect();
        target.classList.add(
          e.clientY < rect.top + rect.height / 2
            ? 'drag-over-top'
            : 'drag-over-bottom',
        );
      }
    };

    const onDragleave = (e: DragEvent) => {
      const el = (e.target as HTMLElement).closest(
        '.act-wrapper, .day-card',
      );
      el?.classList.remove('drag-over-top', 'drag-over-bottom');
    };

    const onDrop = (e: DragEvent) => {
      if (!dndSrc) return;
      e.preventDefault();
      clearDnd();

      const targetEl = e.target as HTMLElement;

      if (dndType === 'act') {
        const target = targetEl.closest('.act-wrapper') as HTMLElement | null;
        if (
          !target ||
          target === dndSrc ||
          target.dataset.dayid !== dndSrc.dataset.dayid
        )
          return;
        const rect = target.getBoundingClientRect();
        const before = e.clientY < rect.top + target.offsetHeight / 2;
        onReorderActivities(
          dndSrc.dataset.dayid!,
          dndSrc.dataset.actid!,
          target.dataset.actid!,
          before,
        );
      } else {
        const target = targetEl.closest('.day-card') as HTMLElement | null;
        if (!target || target === dndSrc) return;
        const rect = target.getBoundingClientRect();
        const before = e.clientY < rect.top + target.offsetHeight / 2;
        onReorderDays(dndSrc.dataset.dayid!, target.dataset.dayid!, before);
      }
    };

    const onDragend = () => {
      clearDnd();
      if (dndSrc) dndSrc.classList.remove('dragging');
      dndSrc = null;
      dndType = null;
      pendingSrc = null;
      pendingType = null;
      document
        .querySelectorAll('.act-wrapper[draggable], .day-card[draggable]')
        .forEach((el) => el.removeAttribute('draggable'));
    };

    document.addEventListener('mousedown', onMousedown);
    document.addEventListener('mouseup', onMouseup);
    document.addEventListener('dragstart', onDragstart);
    document.addEventListener('dragover', onDragover);
    document.addEventListener('dragleave', onDragleave);
    document.addEventListener('drop', onDrop);
    document.addEventListener('dragend', onDragend);

    return () => {
      document.removeEventListener('mousedown', onMousedown);
      document.removeEventListener('mouseup', onMouseup);
      document.removeEventListener('dragstart', onDragstart);
      document.removeEventListener('dragover', onDragover);
      document.removeEventListener('dragleave', onDragleave);
      document.removeEventListener('drop', onDrop);
      document.removeEventListener('dragend', onDragend);
    };
  }, [onReorderActivities, onReorderDays]);
}

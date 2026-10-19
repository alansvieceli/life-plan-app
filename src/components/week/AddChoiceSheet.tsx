import { ActionButton } from '../common/ActionButton';
import { ModalShell } from '../common/ModalShell';

type AddChoiceSheetProps = {
  onEvent: () => void;
  onTask: () => void;
  onClose: () => void;
};

export function AddChoiceSheet({ onEvent, onTask, onClose }: AddChoiceSheetProps) {
  return (
    <ModalShell onClose={onClose} title="O que você quer adicionar?">
      <ActionButton icon="calendar-outline" label="Evento" onPress={onEvent} />
      <ActionButton icon="checkbox-outline" label="Tarefa" onPress={onTask} />
    </ModalShell>
  );
}

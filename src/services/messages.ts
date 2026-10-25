import { extrasMocked } from './deafExtras';

export interface Message {
  id: string;
  mine: boolean;
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  name: string;
  subtitle: string;
  preview: string;
  when: string;
  unread: boolean;
  messages: Message[];
}

const SAMPLE: Conversation[] = [
  {
    id: '1',
    name: 'Amina Okafor',
    subtitle: 'Interpreter',
    preview: 'Thanks, see you at the next appointment.',
    when: '9:14 AM',
    unread: true,
    messages: [
      {
        id: 'a',
        mine: false,
        text: 'Confirming our session tomorrow at 9:00 AM.',
        time: '9:10 AM',
      },
      { id: 'b', mine: true, text: 'Yes, that works. See you then!', time: '9:12 AM' },
    ],
  },
  {
    id: '2',
    name: 'SignConnect Support',
    subtitle: 'Support team',
    preview: 'Your request has been resolved.',
    when: 'Yesterday',
    unread: false,
    messages: [
      { id: 'c', mine: false, text: 'Your request has been resolved.', time: 'Yesterday' },
    ],
  },
];

/** The person's conversations. Empty while messaging is not live. */
export async function getConversations(): Promise<Conversation[]> {
  return extrasMocked() ? structuredClone(SAMPLE) : [];
}

export function matchesSearch(c: Conversation, search: string) {
  const q = search.trim().toLowerCase();
  return !q || `${c.name} ${c.preview}`.toLowerCase().includes(q);
}

export function withSentMessage(c: Conversation, text: string, time: string): Conversation {
  const message: Message = { id: `m${c.messages.length + 1}`, mine: true, text, time };
  return { ...c, messages: [...c.messages, message], preview: text, when: time, unread: false };
}

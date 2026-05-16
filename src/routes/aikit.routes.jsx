import AutoWrite from '../pages/aikit/auto-write';
import Scheduled from '../pages/aikit/scheduled';
import Repurpose from '../pages/aikit/repurpose';
import RSS from '../pages/aikit/rss';
import Chatbot from '../pages/aikit/chatbot';
import FineTuneModels from '../pages/aikit/fine-tune-models';
import Prompt from '../pages/aikit/prompt';
import AikitSetting from '../pages/aikit/setting';
import Import from '../pages/aikit/import';

export const aikitRoutes = [
    { path: '/auto-write', element: <AutoWrite /> },
    { path: '/scheduled', element: <Scheduled /> },
    { path: '/repurpose', element: <Repurpose /> },
    { path: '/rss', element: <RSS /> },
    { path: '/chatbot', element: <Chatbot /> },
    { path: '/fine-tune-models', element: <FineTuneModels /> },
    { path: '/prompt', element: <Prompt /> },
    { path: '/setting', element: <AikitSetting /> },
    { path: '/import', element: <Import /> },
];

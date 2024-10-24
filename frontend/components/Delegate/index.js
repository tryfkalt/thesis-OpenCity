
import dynamic from 'next/dynamic';

const DelegateComponent = dynamic(() => import('./Delegate'), {
  ssr: false,
});

export default DelegateComponent;
// File: app/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  
  const handleNavigation = () => {
    router.push('/search');
  };
  
  const sdgIcons = [
    { number: '01', suffix: 'NoPoverty' },
    { number: '02', suffix: 'ZeroHunger' },
    { number: '03', suffix: 'GoodHealth' },
    { number: '04', suffix: 'QualityEducation' },
    { number: '05', suffix: 'GenderEquality' },
    { number: '06', suffix: 'CleanWaterSanitation' },
    { number: '07', suffix: 'CleanEnergy' },
    { number: '08', suffix: 'DecentWork' },
    { number: '09', suffix: 'Industry' },
    { number: '10', suffix: 'ReducedInequalities' },
    { number: '11', suffix: 'SustainableCities' },
    { number: '12', suffix: 'ResponsibleConsumption' },
    { number: '13', suffix: 'Climate' },
    { number: '14', suffix: 'LifeBelowWater' },
    { number: '15', suffix: 'LifeOnLand' },
    { number: '16', suffix: 'PeaceJusticeInstitutions' },
    { number: '17', suffix: 'Partnerships' }
  ];
  
  return (
    <div 
      onClick={handleNavigation}
      className="min-h-screen p-8 flex flex-col items-center gap-8 bg-gray-50 cursor-pointer transition-colors hover:bg-gray-100"
    >
      <div className="text-center p-4">
        <h1 className="text-4xl text-gray-800 font-semibold m-0 md:text-3xl sm:text-2xl">
          Sustainable Development Goals
        </h1>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-7xl w-full p-4">
        {sdgIcons.map(({ number, suffix }) => (
          <div 
            key={number}
            className="transition-transform hover:scale-105 duration-200"
          >
            <Image 
              src={`/icons/Sustainable_Development_Goal_${number}${suffix}.svg`}
              alt={`SDG ${number}: ${suffix.replace(/([A-Z])/g, ' $1').trim()}`}
              width={100} 
              height={100}
              className="w-full h-auto"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

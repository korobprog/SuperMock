import React from 'react';
import PhotoPlaceholder from './PhotoPlaceholder';
import ProfilePhoto from './ProfilePhoto';

const PhotoPlaceholderDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold text-center mb-8">Демонстрация плейсхолдеров</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Маленький</h3>
          <PhotoPlaceholder size="sm" />
        </div>
        
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Средний</h3>
          <PhotoPlaceholder size="md" />
        </div>
        
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Большой</h3>
          <PhotoPlaceholder size="lg" />
        </div>
        
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Очень большой</h3>
          <PhotoPlaceholder size="xl" />
        </div>
      </div>
      
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold">С загрузкой изображения</h3>
        <ProfilePhoto 
          src="/placeholder-image.jpg" 
          alt="Демо изображение" 
          size="xl"
        />
      </div>
    </div>
  );
};

export default PhotoPlaceholderDemo;

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
  onClose: () => void;
}

interface GifResult {
  id: string;
  title: string;
  images: {
    fixed_height_small: {
      url: string;
      width: string;
      height: string;
    };
  };
}

export const GifPicker: React.FC<GifPickerProps> = ({ onGifSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Note: In a real implementation, you would use the Giphy API
  // For this demo, we'll use placeholder data
  const mockGifs: GifResult[] = [
    {
      id: '1',
      title: 'Happy',
      images: {
        fixed_height_small: {
          url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
          width: '200',
          height: '200'
        }
      }
    },
    {
      id: '2',
      title: 'Thumbs Up',
      images: {
        fixed_height_small: {
          url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
          width: '200',
          height: '200'
        }
      }
    }
  ];

  useEffect(() => {
    // Load trending GIFs on mount
    setGifs(mockGifs);
  }, []);

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      setGifs(mockGifs);
      return;
    }

    setLoading(true);
    // In a real implementation, you would call the Giphy API here
    // For now, we'll filter mock data
    const filtered = mockGifs.filter(gif => 
      gif.title.toLowerCase().includes(query.toLowerCase())
    );
    setGifs(filtered);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGifs(searchTerm);
  };

  return (
    <div className="w-80 h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Choose a GIF</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onGifSelect(gif.images.fixed_height_small.url)}
                className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        
        {!loading && gifs.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No GIFs found
          </div>
        )}
      </div>
    </div>
  );
};
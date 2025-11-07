import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import SearchResults from "./SearchResults";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [companions, setCompanions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setUsers([]);
        setPosts([]);
        setCompanions([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      // Search users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(5);

      // Search posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          profiles:user_id (username)
        `)
        .ilike('content', `%${query}%`)
        .limit(5);

      // Search AI companions
      const { data: companionsData } = await supabase
        .from('ai_companions')
        .select('id, name, tagline, avatar_url')
        .or(`name.ilike.%${query}%,tagline.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(5);

      setUsers(usersData || []);
      setPosts(postsData || []);
      setCompanions(companionsData || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search users, posts, companions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.trim() && setShowResults(true)}
          className="pl-10 bg-muted/50 border-border/50 focus:bg-card"
        />
      </div>
      
      {showResults && searchQuery.trim() && (
        <SearchResults
          users={users}
          posts={posts}
          companions={companions}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default SearchBar;

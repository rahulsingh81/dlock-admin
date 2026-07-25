import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  Star,
  MapPin,
  Globe,
  Phone,
  Mail,
  Tag,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCheck,
  MessageSquare,
  Settings,
  BarChart3,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

// Types
interface LiveChat {
  _id: string;
  _uid: string;
  visitor_id: string;
  visitor_name: string;
  visitor_email?: string;
  chat_status: 'active' | 'waiting' | 'closed' | 'transferred';
  operator_id?: string;
  operator_name?: string;
  started_at: string;
  ended_at?: string;
  messages_count: number;
  last_message: string;
  last_message_time: string;
  visitor_country?: string;
  visitor_city?: string;
  page_url: string;
  page_title: string;
  chat_rating?: number;
  chat_feedback?: string;
  tags?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface ChatMessage {
  id: string;
  sender: 'visitor' | 'operator';
  sender_name: string;
  message: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
}

const LiveChatManagement: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [chats, setChats] = useState<LiveChat[]>([]);
  const [filteredChats, setFilteredChats] = useState<LiveChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<LiveChat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showChatDetails, setShowChatDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const chatsPerPage = 10;
  const totalPages = Math.ceil(filteredChats.length / chatsPerPage);
  const startIndex = (currentPage - 1) * chatsPerPage;
  const currentChats = filteredChats.slice(startIndex, startIndex + chatsPerPage);

  // Enhanced mock data with real-time simulation
  useEffect(() => {
    const mockChats: LiveChat[] = [
      {
        _id: '1',
        _uid: 'admin',
        visitor_id: 'v1',
        visitor_name: 'John Doe',
        visitor_email: 'john@example.com',
        chat_status: 'active',
        operator_id: 'op1',
        operator_name: 'Sarah Admin',
        started_at: new Date().toISOString(),
        messages_count: 15,
        last_message: 'Thank you for your help with my order! Can you provide tracking info?',
        last_message_time: new Date(Date.now() - 2 * 60000).toISOString(),
        visitor_country: 'United States',
        visitor_city: 'New York',
        page_url: '/products/laptop',
        page_title: 'Gaming Laptops - TechStore',
        chat_rating: 5,
        tags: 'order,support,satisfied,tracking',
        priority: 'medium'
      },
      {
        _id: '2',
        _uid: 'admin',
        visitor_id: 'v2',
        visitor_name: 'Maria Garcia',
        visitor_email: 'maria@example.com',
        chat_status: 'waiting',
        started_at: new Date(Date.now() - 5 * 60000).toISOString(),
        messages_count: 3,
        last_message: 'I need urgent help with my recent purchase - it\'s not working properly',
        last_message_time: new Date(Date.now() - 1 * 60000).toISOString(),
        visitor_country: 'Spain',
        visitor_city: 'Madrid',
        page_url: '/support',
        page_title: 'Customer Support - TechStore',
        priority: 'urgent'
      },
      {
        _id: '3',
        _uid: 'admin',
        visitor_id: 'v3',
        visitor_name: 'Anonymous User',
        chat_status: 'closed',
        operator_id: 'op2',
        operator_name: 'Mike Support',
        started_at: new Date(Date.now() - 120 * 60000).toISOString(),
        ended_at: new Date(Date.now() - 90 * 60000).toISOString(),
        messages_count: 8,
        last_message: 'Thanks for the quick resolution! Problem solved.',
        last_message_time: new Date(Date.now() - 90 * 60000).toISOString(),
        visitor_country: 'United Kingdom',
        visitor_city: 'London',
        page_url: '/checkout',
        page_title: 'Checkout - TechStore',
        chat_rating: 4,
        chat_feedback: 'Great support team, very helpful',
        priority: 'low'
      },
      {
        _id: '4',
        _uid: 'admin',
        visitor_id: 'v4',
        visitor_name: 'Alex Johnson',
        visitor_email: 'alex.j@company.com',
        chat_status: 'transferred',
        operator_id: 'op1',
        operator_name: 'Sarah Admin',
        started_at: new Date(Date.now() - 30 * 60000).toISOString(),
        messages_count: 12,
        last_message: 'I\'ve been transferred to a specialist. Waiting for response.',
        last_message_time: new Date(Date.now() - 15 * 60000).toISOString(),
        visitor_country: 'Canada',
        visitor_city: 'Toronto',
        page_url: '/enterprise',
        page_title: 'Enterprise Solutions - TechStore',
        tags: 'enterprise,technical,escalated',
        priority: 'high'
      },
      {
        _id: '5',
        _uid: 'admin',
        visitor_id: 'v5',
        visitor_name: 'Emma Wilson',
        chat_status: 'waiting',
        started_at: new Date(Date.now() - 3 * 60000).toISOString(),
        messages_count: 1,
        last_message: 'Hello, I have a question about your return policy.',
        last_message_time: new Date(Date.now() - 3 * 60000).toISOString(),
        visitor_country: 'Australia',
        visitor_city: 'Sydney',
        page_url: '/returns',
        page_title: 'Return Policy - TechStore',
        priority: 'medium'
      }
    ];
    
    setChats(mockChats);
    setFilteredChats(mockChats);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setChats(current => current.map(chat => {
        // Randomly update active chats
        if (chat.chat_status === 'active' && Math.random() > 0.95) {
          return {
            ...chat,
            last_message_time: new Date().toISOString(),
            messages_count: chat.messages_count + 1
          };
        }
        return chat;
      }));
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = chats.filter(chat => {
      const matchesSearch = 
        chat.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.visitor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.last_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.page_title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || chat.chat_status === statusFilter;
      const matchesOperator = operatorFilter === 'all'
        ? true
        : operatorFilter === 'unassigned'
          ? !chat.operator_id
          : chat.operator_id === operatorFilter;
      const matchesPriority = priorityFilter === 'all' || chat.priority === priorityFilter;

      let matchesDate = true;
      if (dateFilter !== 'all' && chat.started_at) {
        const d = new Date(chat.started_at);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') matchesDate = d >= startOfToday;
        else if (dateFilter === 'yesterday') {
          const y = new Date(startOfToday); y.setDate(y.getDate() - 1);
          matchesDate = d >= y && d < startOfToday;
        } else if (dateFilter === 'week') {
          const w = new Date(startOfToday); w.setDate(w.getDate() - 7); matchesDate = d >= w;
        } else if (dateFilter === 'month') {
          const m = new Date(startOfToday); m.setMonth(m.getMonth() - 1); matchesDate = d >= m;
        }
      }

      return matchesSearch && matchesStatus && matchesOperator && matchesPriority && matchesDate;
    });

    setFilteredChats(filtered);
    setCurrentPage(1);
  }, [chats, searchQuery, statusFilter, operatorFilter, priorityFilter, dateFilter]);

  // Status counts
  const statusCounts = {
    total: chats.length,
    active: chats.filter(c => c.chat_status === 'active').length,
    waiting: chats.filter(c => c.chat_status === 'waiting').length,
    closed: chats.filter(c => c.chat_status === 'closed').length,
    transferred: chats.filter(c => c.chat_status === 'transferred').length
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
      transferred: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return styles[status as keyof typeof styles] || styles.closed;
  };

  // Priority badge styling
  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return styles[priority as keyof typeof styles] || styles.low;
  };

  // Time formatting
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Chat operations
  const updateChatStatus = async (chatId: string, newStatus: string) => {
    try {
      setChats(prev => prev.map(chat => 
        chat._id === chatId 
          ? { ...chat, chat_status: newStatus as any }
          : chat
      ));
      toast({
        title: "Status Updated",
        description: `Chat status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update chat status",
        variant: "destructive",
      });
    }
  };

  const assignOperator = async (chatId: string, operatorId: string, operatorName: string) => {
    try {
      setChats(prev => prev.map(chat => 
        chat._id === chatId 
          ? { ...chat, operator_id: operatorId, operator_name: operatorName }
          : chat
      ));
      toast({
        title: "Operator Assigned",
        description: `Chat assigned to ${operatorName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign operator",
        variant: "destructive",
      });
    }
  };

  const sendQuickReply = async (chatId: string, message: string) => {
    try {
      // In real implementation, this would send message via Tawk.to API
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'operator',
        sender_name: 'Admin',
        message,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setChatMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      toast({
        title: "Message Sent",
        description: "Quick reply sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const refreshChats = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Refreshed",
        description: "Chat data refreshed successfully",
      });
    }, 1000);
  };

  return (
    <div>
     
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              Live Chat Management
            </h1>
            <p className="text-gray-600 mt-1">Manage Tawk.to live chat conversations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={refreshChats}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tawk.to Integration Settings</DialogTitle>
                  <DialogDescription>
                    Configure your Tawk.to integration settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tawkto-id">Tawk.to Property ID</Label>
                    <Input id="tawkto-id" placeholder="Enter your Tawk.to Property ID" />
                  </div>
                  <div>
                    <Label htmlFor="widget-id">Widget ID</Label>
                    <Input id="widget-id" placeholder="Enter your Widget ID" />
                  </div>
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Input id="api-key" type="password" placeholder="Enter your API Key" />
                  </div>
                  <Button className="w-full">Save Settings</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Real-time Status Overview Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Chats</p>
                  <p className="text-2xl font-bold">{statusCounts.total}</p>
                  <p className="text-xs text-purple-200 mt-1">All conversations</p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-200" />
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium flex items-center gap-1">
                    Active
                    {statusCounts.active > 0 && (
                      <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
                    )}
                  </p>
                  <p className="text-2xl font-bold">{statusCounts.active}</p>
                  <p className="text-xs text-green-200 mt-1">Ongoing chats</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium flex items-center gap-1">
                    Waiting
                    {statusCounts.waiting > 0 && (
                      <div className="w-2 h-2 bg-yellow-200 rounded-full animate-bounce"></div>
                    )}
                  </p>
                  <p className="text-2xl font-bold">{statusCounts.waiting}</p>
                  <p className="text-xs text-yellow-200 mt-1">Need attention</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm font-medium">Closed</p>
                  <p className="text-2xl font-bold">{statusCounts.closed}</p>
                  <p className="text-xs text-gray-200 mt-1">Completed</p>
                </div>
                <Users className="h-8 w-8 text-gray-200" />
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium flex items-center gap-1">
                    Transferred
                    {statusCounts.transferred > 0 && (
                      <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
                    )}
                  </p>
                  <p className="text-2xl font-bold">{statusCounts.transferred}</p>
                  <p className="text-xs text-blue-200 mt-1">Escalated</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-200" />
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Alert Banner */}
        {chats.filter(c => c.priority === 'urgent' && c.chat_status !== 'closed').length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
                <div>
                  <p className="font-semibold text-red-800">
                    Urgent Attention Required!
                  </p>
                  <p className="text-sm text-red-700">
                    {chats.filter(c => c.priority === 'urgent' && c.chat_status !== 'closed').length} urgent chat(s) need immediate attention
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="ml-auto bg-red-600 hover:bg-red-700"
                  onClick={() => setPriorityFilter('urgent')}
                >
                  View Urgent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  <SelectItem value="op1">Sarah Admin</SelectItem>
                  <SelectItem value="op2">Mike Support</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Chat List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Live Chats ({filteredChats.length})
              </span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentChats.map((chat) => (
                <Card key={chat._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              chat.chat_status === 'active' ? 'bg-green-500' :
                              chat.chat_status === 'waiting' ? 'bg-yellow-500' :
                              chat.chat_status === 'transferred' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}>
                              {chat.visitor_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{chat.visitor_name}</h3>
                                {chat.chat_status === 'active' && (
                                  <div className="relative group">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      Currently active
                                    </div>
                                  </div>
                                )}
                                {chat.priority === 'urgent' && (
                                  <div className="relative group">
                                    <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      Urgent priority
                                    </div>
                                  </div>
                                )}
                              </div>
                              {chat.visitor_email && (
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {chat.visitor_email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <Badge className={getStatusBadge(chat.chat_status)}>
                              {chat.chat_status}
                            </Badge>
                            <Badge className={getPriorityBadge(chat.priority)}>
                              {chat.priority}
                            </Badge>
                            {chat.chat_rating && (
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="h-3 w-3 fill-current" />
                                <span className="text-xs font-medium">{chat.chat_rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {chat.visitor_country}, {chat.visitor_city}
                            </p>
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Started {formatTime(chat.started_at)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {chat.messages_count} messages
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last: {formatTime(chat.last_message_time)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-700">Last Message:</p>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const timeDiff = new Date().getTime() - new Date(chat.last_message_time).getTime();
                                const minutes = Math.floor(timeDiff / 60000);
                                if (minutes > 30 && chat.chat_status === 'waiting') {
                                  return (
                                    <div className="flex items-center gap-1 text-red-600">
                                      <AlertCircle className="h-3 w-3" />
                                      <span className="text-xs font-medium">Delayed Response</span>
                                    </div>
                                  );
                                } else if (minutes > 10 && chat.chat_status === 'active') {
                                  return (
                                    <div className="flex items-center gap-1 text-yellow-600">
                                      <Clock className="h-3 w-3" />
                                      <span className="text-xs font-medium">Response Due</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              <span className="text-xs text-gray-500">{formatTime(chat.last_message_time)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{chat.last_message}</p>
                          {chat.tags && (
                            <div className="flex items-center gap-1 mt-2">
                              <Tag className="h-3 w-3 text-gray-400" />
                              <div className="flex gap-1">
                                {chat.tags.split(',').slice(0, 3).map((tag, index) => (
                                  <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {chat.operator_name && (
                          <p className="text-sm text-blue-600 flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            Assigned to: {chat.operator_name}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Chat Details - {chat.visitor_name}</DialogTitle>
                            </DialogHeader>
                            <Tabs defaultValue="conversation" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="conversation">Conversation</TabsTrigger>
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="actions">Actions</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="conversation" className="space-y-4">
                                <ScrollArea className="h-[400px] border rounded-lg p-4">
                                  <div className="space-y-4">
                                    {/* Enhanced conversation history */}
                                    <div className="flex justify-start">
                                      <div className="bg-gray-100 rounded-lg p-3 max-w-[70%]">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {chat.visitor_name.charAt(0)}
                                          </div>
                                          <p className="text-sm font-medium text-gray-900">{chat.visitor_name}</p>
                                        </div>
                                        <p className="text-sm text-gray-700">Hi, I need help with my order. Order #12345</p>
                                        <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-end">
                                      <div className="bg-blue-100 rounded-lg p-3 max-w-[70%]">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            SA
                                          </div>
                                          <p className="text-sm font-medium text-blue-900">Sarah Admin</p>
                                        </div>
                                        <p className="text-sm text-blue-700">Hello! I'd be happy to help. Let me check your order status for you.</p>
                                        <p className="text-xs text-blue-500 mt-1">2 hours ago</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-start">
                                      <div className="bg-gray-100 rounded-lg p-3 max-w-[70%]">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {chat.visitor_name.charAt(0)}
                                          </div>
                                          <p className="text-sm font-medium text-gray-900">{chat.visitor_name}</p>
                                        </div>
                                        <p className="text-sm text-gray-700">{chat.last_message}</p>
                                        <p className="text-xs text-gray-500 mt-1">{formatTime(chat.last_message_time)}</p>
                                      </div>
                                    </div>
                                    
                                    {chatMessages.map((msg) => (
                                      <div key={msg.id} className={`flex ${msg.sender === 'visitor' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`rounded-lg p-3 max-w-[70%] ${
                                          msg.sender === 'visitor' ? 'bg-gray-100' : 'bg-blue-100'
                                        }`}>
                                          <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                              msg.sender === 'visitor' ? 'bg-blue-500' : 'bg-green-500'
                                            }`}>
                                              {msg.sender === 'visitor' ? chat.visitor_name.charAt(0) : 'AD'}
                                            </div>
                                            <p className={`text-sm font-medium ${
                                              msg.sender === 'visitor' ? 'text-gray-900' : 'text-blue-900'
                                            }`}>
                                              {msg.sender_name}
                                            </p>
                                          </div>
                                          <p className={`text-sm ${
                                            msg.sender === 'visitor' ? 'text-gray-700' : 'text-blue-700'
                                          }`}>
                                            {msg.message}
                                          </p>
                                          <p className={`text-xs mt-1 ${
                                            msg.sender === 'visitor' ? 'text-gray-500' : 'text-blue-500'
                                          }`}>
                                            {formatTime(msg.timestamp)}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                                
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendQuickReply(chat._id, newMessage)}
                                  />
                                  <Button onClick={() => sendQuickReply(chat._id, newMessage)}>
                                    Send
                                  </Button>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="h-5 w-5 text-blue-600" />
                                        Visitor Information
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                          {chat.visitor_name.charAt(0)}
                                        </div>
                                        <div>
                                          <p className="font-semibold">{chat.visitor_name}</p>
                                          <p className="text-sm text-gray-600 flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {chat.visitor_email || 'Not provided'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-gray-500" />
                                          <span><strong>Location:</strong> {chat.visitor_city}, {chat.visitor_country}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Globe className="h-4 w-4 text-gray-500" />
                                          <span><strong>Page:</strong> {chat.page_title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Globe className="h-4 w-4 text-gray-500" />
                                          <span><strong>URL:</strong> {chat.page_url}</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-green-600" />
                                        Chat Analytics
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                          <p className="text-2xl font-bold text-blue-600">{chat.messages_count}</p>
                                          <p className="text-xs text-blue-700">Messages</p>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                          <p className="text-2xl font-bold text-green-600">
                                            {chat.chat_rating ? `${chat.chat_rating}/5` : 'N/A'}
                                          </p>
                                          <p className="text-xs text-green-700">Rating</p>
                                        </div>
                                      </div>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-600">Status:</span>
                                          <Badge className={getStatusBadge(chat.chat_status)}>
                                            {chat.chat_status}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-600">Priority:</span>
                                          <Badge className={getPriorityBadge(chat.priority)}>
                                            {chat.priority}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-600">Started:</span>
                                          <span className="font-medium">{formatTime(chat.started_at)}</span>
                                        </div>
                                        {chat.ended_at && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Ended:</span>
                                            <span className="font-medium">{formatTime(chat.ended_at)}</span>
                                          </div>
                                        )}
                                        {chat.operator_name && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Operator:</span>
                                            <span className="font-medium text-blue-600">{chat.operator_name}</span>
                                          </div>
                                        )}
                                      </div>
                                      {chat.chat_feedback && (
                                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                          <p className="text-sm font-medium text-yellow-800">Customer Feedback:</p>
                                          <p className="text-sm text-yellow-700 mt-1">{chat.chat_feedback}</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="actions" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Change Status</Label>
                                    <Select value={chat.chat_status} onValueChange={(value) => updateChatStatus(chat._id, value)}>
                                      <SelectTrigger className="mt-2">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="waiting">Waiting</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                        <SelectItem value="transferred">Transferred</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Assign Operator</Label>
                                    <Select onValueChange={(value) => {
                                      const operators = {
                                        'op1': 'Sarah Admin',
                                        'op2': 'Mike Support'
                                      };
                                      assignOperator(chat._id, value, operators[value as keyof typeof operators]);
                                    }}>
                                      <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Select operator" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="op1">Sarah Admin</SelectItem>
                                        <SelectItem value="op2">Mike Support</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>Add Tags</Label>
                                  <Input 
                                    className="mt-2"
                                    placeholder="Enter tags separated by commas"
                                    defaultValue={chat.tags}
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-base font-semibold">Quick Reply Templates</Label>
                                  <div className="mt-3 space-y-3">
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Greetings</p>
                                      <div className="flex flex-wrap gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "Hello! Thank you for contacting us. How can I assist you today?")}
                                        >
                                          Welcome
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "Hi there! I'm here to help. What can I do for you?")}
                                        >
                                          Friendly
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Support Responses</p>
                                      <div className="flex flex-wrap gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "I understand your concern. Let me check this for you right away.")}
                                        >
                                          Acknowledgment
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "I'm looking into this issue for you. Please give me a moment.")}
                                        >
                                          Processing
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "Thank you for providing that information. This helps me assist you better.")}
                                        >
                                          Appreciation
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Resolution & Follow-up</p>
                                      <div className="flex flex-wrap gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "I've resolved your issue. Please check and let me know if everything looks good.")}
                                        >
                                          Resolution
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "Is there anything else I can help you with today?")}
                                        >
                                          Follow-up
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "Thank you for choosing our service. Have a great day!")}
                                        >
                                          Closing
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Technical Support</p>
                                      <div className="flex flex-wrap gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "Could you please provide your order number so I can look this up for you?")}
                                        >
                                          Order Info
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "I'm transferring you to our technical specialist who can better assist you.")}
                                        >
                                          Transfer
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => sendQuickReply(chat._id, "I'll send you a follow-up email with detailed instructions within the next hour.")}
                                        >
                                          Email Follow-up
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                        
                        <div className="flex gap-1">
                          {chat.chat_status === 'waiting' && (
                            <Button
                              size="sm"
                              onClick={() => updateChatStatus(chat._id, 'active')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Accept
                            </Button>
                          )}
                          {chat.chat_status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateChatStatus(chat._id, 'closed')}
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(startIndex + chatsPerPage, filteredChats.length)} of {filteredChats.length} chats
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tawk.to Integration Script */}
        
      </div>
      </div>
    </div>
  );
};

export default LiveChatManagement;
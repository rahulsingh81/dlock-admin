import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Settings,
  ArrowRight
} from 'lucide-react';
import { 
  fetchTickets, 
  fetchTicketStats, 
  createNewTicket, 
  updateExistingTicket, 
  removeTicket, 
  addReplyToTicket, 
  changeTicketStatus 
} from '@/services/api';

// Types
interface Ticket {
  _id: string;
  _uid: string;
  title: string;
  description: string;
  customer_name: string;
  customer_email: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  message: string;
  timestamp: string;
  sender: 'admin' | 'customer';
}

const TicketManagement: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const itemsPerPage = 10;

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customer_name: '',
    customer_email: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  // Fetch tickets from backend
  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage
      };
      
      const data = await fetchTickets(params);
      
      if (data) {
        setTickets(data.tickets || data || []);
        setFilteredTickets(data.tickets || data || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch tickets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch ticket statistics
  const loadStats = async () => {
    try {
      await fetchTicketStats();
      // You can use these stats in your dashboard if needed
    } catch (error: any) {
      console.error("Failed to fetch stats:", error.message);
    }
  };

  // Load tickets on component mount and when filters change
  useEffect(() => {
    loadTickets();
    loadStats();
  }, [currentPage, statusFilter, priorityFilter, searchTerm]);

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'resolved': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // CRUD Operations
  const createTicketHandler = async () => {
    if (!formData.title || !formData.customer_name || !formData.customer_email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newTicket = await createNewTicket(formData);
      setTickets([newTicket, ...tickets]);
      setFormData({
        title: '',
        description: '',
        customer_name: '',
        customer_email: '',
        priority: 'medium'
      });
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Ticket created successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive"
      });
    }
  };

  const updateTicketHandler = async () => {
    if (!selectedTicket || !formData.title || !formData.customer_name || !formData.customer_email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedTicket = await updateExistingTicket(selectedTicket._id, formData);
      const updatedTickets = tickets.map(ticket =>
        ticket._id === selectedTicket._id ? updatedTicket : ticket
      );
      setTickets(updatedTickets);
      setIsEditDialogOpen(false);
      setSelectedTicket(null);
      
      toast({
        title: "Success",
        description: "Ticket updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket",
        variant: "destructive"
      });
    }
  };

  const deleteTicketHandler = async (ticketId: string) => {
    try {
      await removeTicket(ticketId);
      setTickets(tickets.filter(ticket => ticket._id !== ticketId));
      toast({
        title: "Success",
        description: "Ticket deleted successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticket",
        variant: "destructive"
      });
    }
  };

  const updateTicketStatusHandler = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      const updatedTicket = await changeTicketStatus(ticketId, newStatus);
      const updatedTickets = tickets.map(ticket =>
        ticket._id === ticketId ? updatedTicket : ticket
      );
      setTickets(updatedTickets);

      const statusLabels = {
        'open': 'Open',
        'in_progress': 'In Progress', 
        'resolved': 'Resolved',
        'closed': 'Closed'
      };

      toast({
        title: "Status Updated",
        description: `Ticket marked as "${statusLabels[newStatus]}". Status change recorded in ticket history.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const addReplyHandler = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
      return;
    }

    try {
      const updatedTicket = await addReplyToTicket(selectedTicket._id, { message: replyMessage });
      setTickets(tickets.map(ticket =>
        ticket._id === selectedTicket._id ? updatedTicket : ticket
      ));
      setSelectedTicket(updatedTicket);
      setReplyMessage('');
      
      toast({
        title: "Success",
        description: "Reply added successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add reply",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      customer_name: ticket.customer_name,
      customer_email: ticket.customer_email,
      priority: ticket.priority
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      customer_name: '',
      customer_email: '',
      priority: 'medium'
    });
  };

  // Calculate total pages based on backend response
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ticket Management</h1>
          <p className="text-muted-foreground">
            Manage customer support tickets efficiently
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>
                Add a new support ticket to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter ticket title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the issue"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Customer Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createTicketHandler}>Create Ticket</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Status Management Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin Status Management</CardTitle>
          <CardDescription>Quick overview and ticket status workflow management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Total Tickets Card */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {tickets.length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
            </div>
            
            {/* Status Cards */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Open</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {tickets.filter(t => t.status === 'open').length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">In Progress</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {tickets.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-700">
                    {tickets.filter(t => t.status === 'resolved').length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Closed</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {tickets.filter(t => t.status === 'closed').length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Status Workflow Guide */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Open
            </span>
            <ArrowRight className="w-4 h-4" />
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              In Progress
            </span>
            <ArrowRight className="w-4 h-4" />
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Resolved
            </span>
            <ArrowRight className="w-4 h-4" />
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              Closed
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Tickets</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, customer, email, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority-filter">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Tickets ({tickets.length})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p>Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tickets found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first ticket to get started'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 
                            className="font-semibold text-lg cursor-pointer hover:text-primary"
                            onClick={() => openViewDialog(ticket)}
                          >
                            {ticket.title}
                          </h3>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>
                            <strong>Customer:</strong> {ticket.customer_name}
                          </span>
                          <span>
                            <strong>Email:</strong> {ticket.customer_email}
                          </span>
                          <span>
                            <strong>Created:</strong> {formatDate(ticket.created_at)}
                          </span>
                          {ticket.replies.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {ticket.replies.length} replies
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(ticket)}
                          title="View & Reply"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(ticket)}
                          title="Edit Ticket"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {/* Status Update Dropdown */}
                        <div className="relative">
                          <Select 
                            value={ticket.status} 
                            onValueChange={(newStatus: any) => updateTicketStatusHandler(ticket._id, newStatus)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <div className="flex items-center gap-1">
                                <Settings className="w-3 h-3" />
                                <span className="text-xs">Status</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open" className="text-blue-600">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  Open
                                </div>
                              </SelectItem>
                              <SelectItem value="in_progress" className="text-orange-600">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  In Progress
                                </div>
                              </SelectItem>
                              <SelectItem value="resolved" className="text-green-600">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Resolved
                                </div>
                              </SelectItem>
                              <SelectItem value="closed" className="text-gray-600">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                  Closed
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Quick Status Action Buttons */}
                        {ticket.status === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateTicketStatusHandler(ticket._id, 'in_progress')}
                            title="Start Working"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateTicketStatusHandler(ticket._id, 'resolved')}
                            title="Mark Resolved"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {ticket.status === 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateTicketStatusHandler(ticket._id, 'closed')}
                            title="Close Ticket"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTicketHandler(ticket._id)}
                          title="Delete Ticket"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>
              Update ticket information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-customer-name">Customer Name *</Label>
              <Input
                id="edit-customer-name"
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-customer-email">Customer Email *</Label>
              <Input
                id="edit-customer-email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
                </Button>
              <Button onClick={updateTicketHandler}>Update Ticket</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Reply Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedTicket.title}</DialogTitle>
                    <DialogDescription>
                      Ticket #{selectedTicket._id} • Created {formatDate(selectedTicket.created_at)}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Customer Name</Label>
                    <p className="text-sm">{selectedTicket.customer_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{selectedTicket.customer_email}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                    {selectedTicket.description}
                  </p>
                </div>

                <Separator />

                {/* Replies */}
                <div>
                  <Label className="text-lg font-medium">Conversation</Label>
                  <div className="space-y-4 mt-4 max-h-60 overflow-y-auto">
                    {selectedTicket.replies.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No replies yet. Start the conversation!
                      </p>
                    ) : (
                      selectedTicket.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`p-3 rounded-lg ${
                            reply.sender === 'admin'
                              ? 'bg-primary/10 ml-12'
                              : 'bg-muted mr-12'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">
                              {reply.sender === 'admin' ? 'Admin' : selectedTicket.customer_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(reply.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{reply.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                <div className="space-y-3">
                  <Label htmlFor="reply-message">Add Reply</Label>
                  <Textarea
                    id="reply-message"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={addReplyHandler} disabled={!replyMessage.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketManagement;
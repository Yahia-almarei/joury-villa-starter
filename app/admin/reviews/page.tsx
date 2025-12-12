'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/use-translation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Star,
  Edit,
  Trash2,
  Check,
  X,
  MessageSquare,
  Calendar,
  User,
  Filter
} from 'lucide-react'

interface Review {
  id: string
  name: string
  email: string
  rating: number
  comment: string
  stay_date?: string
  approved: boolean
}

export default function AdminReviewsPage() {
  const { t } = useTranslation('admin')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    rating: 5,
    comment: '',
    stayDate: ''
  })

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/admin/reviews?status=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [filter])

  const handleApprove = async (reviewId: string) => {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action: 'approve' })
      })

      if (response.ok) {
        fetchReviews()
        alert(t('reviews.alerts.approveSuccess'))
      } else {
        alert(t('reviews.alerts.approveError'))
      }
    } catch (error) {
      alert(t('reviews.alerts.approveError'))
    }
  }

  const handleReject = async (reviewId: string) => {
    if (!confirm(t('reviews.alerts.rejectConfirm'))) return

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action: 'reject' })
      })

      if (response.ok) {
        fetchReviews()
        alert(t('reviews.alerts.rejectSuccess'))
      } else {
        alert(t('reviews.alerts.rejectError'))
      }
    } catch (error) {
      alert(t('reviews.alerts.rejectError'))
    }
  }

  const handleEdit = (review: Review) => {
    setEditingReview(review)
    setFormData({
      name: review.name,
      rating: review.rating,
      comment: review.comment,
      stayDate: review.stay_date || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingReview) return

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: editingReview.id,
          ...formData
        })
      })

      if (response.ok) {
        fetchReviews()
        setIsEditDialogOpen(false)
        setEditingReview(null)
        alert(t('reviews.alerts.updateSuccess'))
      } else {
        alert(t('reviews.alerts.updateError'))
      }
    } catch (error) {
      alert(t('reviews.alerts.updateError'))
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm(t('reviews.alerts.deleteConfirm'))) return

    try {
      const response = await fetch(`/api/admin/reviews?reviewId=${reviewId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchReviews()
        alert(t('reviews.alerts.deleteSuccess'))
      } else {
        alert(t('reviews.alerts.deleteError'))
      }
    } catch (error) {
      alert(t('reviews.alerts.deleteError'))
    }
  }

  const renderStars = (rating: number, isEditable = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            } ${isEditable ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={isEditable ? () => setFormData({ ...formData, rating: star }) : undefined}
          />
        ))}
      </div>
    )
  }

  const filteredReviews = reviews.filter(review =>
    review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.comment.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">{t('reviews.loading')}</div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('reviews.title')}</h1>
          <p className="text-muted-foreground">
            {t('reviews.subtitle')}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reviews.filters.all')}</SelectItem>
              <SelectItem value="approved">{t('reviews.filters.approved')}</SelectItem>
              <SelectItem value="pending">{t('reviews.filters.pending')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Input
            placeholder={t('reviews.search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('reviews.stats.totalReviews')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('reviews.stats.approved')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reviews.filter(r => r.approved).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('reviews.stats.pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {reviews.filter(r => !r.approved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{t('reviews.list.title')}</h2>
          <p className="text-muted-foreground">
            {filteredReviews.length} {filteredReviews.length !== 1 ? t('reviews.list.reviewsFound') : t('reviews.list.reviewFound')}
          </p>
        </div>

        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">{t('reviews.list.noReviews')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span className="font-semibold">{review.name}</span>
                        </div>
                        <Badge variant={review.approved ? "default" : "secondary"}>
                          {review.approved ? t('reviews.status.approved') : t('reviews.status.pending')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                          <span>({review.rating}/5)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        {review.stay_date && (
                          <div className="text-sm text-gray-500">
                            {t('reviews.stayDate')}: {review.stay_date}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!review.approved && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(review.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {t('reviews.actions.approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(review.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4 mr-1" />
                            {t('reviews.actions.reject')}
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(review)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {t('reviews.actions.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(review.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {t('reviews.actions.delete')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('reviews.editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('reviews.editDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('reviews.editDialog.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('reviews.editDialog.rating')}</Label>
              {renderStars(formData.rating, true)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">{t('reviews.editDialog.comment')}</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stayDate">{t('reviews.editDialog.stayDate')}</Label>
              <Input
                id="stayDate"
                type="date"
                value={formData.stayDate}
                onChange={(e) => setFormData({ ...formData, stayDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('reviews.editDialog.cancel')}
            </Button>
            <Button onClick={handleSaveEdit}>
              {t('reviews.editDialog.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
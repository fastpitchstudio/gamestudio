// src/components/roster/player-details-modal.tsx
import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database-types'

type Player = Database['public']['Tables']['players']['Row']

interface PlayerDetailsModalProps {
  player: Player
  open: boolean
  onClose: () => void
  onSave: (player: Player) => void
}

export function PlayerDetailsModal({
  player,
  open,
  onClose,
  onSave
}: PlayerDetailsModalProps) {
  const [editedPlayer, setEditedPlayer] = React.useState(player)
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClientComponentClient<Database>()
      const { data, error } = await supabase
        .from('players')
        .update({
          birth_date: editedPlayer.birth_date,
          jersey_size: editedPlayer.jersey_size,
          email: editedPlayer.email,
          phone: editedPlayer.phone,
          parent_name: editedPlayer.parent_name,
          parent_email: editedPlayer.parent_email,
          parent_phone: editedPlayer.parent_phone,
          emergency_contact_name: editedPlayer.emergency_contact_name,
          emergency_contact_phone: editedPlayer.emergency_contact_phone,
          school: editedPlayer.school,
          notes: editedPlayer.notes
        })
        .eq('id', player.id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        onSave(data)
        onClose()
      }
    } catch (error) {
      console.error('Error saving player:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Player Details - {player.first_name} {player.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="birth_date">Birth Date</Label>
            <Input
              id="birth_date"
              type="date"
              value={editedPlayer.birth_date || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                birth_date: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jersey_size">Jersey Size</Label>
            <Input
              id="jersey_size"
              value={editedPlayer.jersey_size || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                jersey_size: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={editedPlayer.email || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                email: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={editedPlayer.phone || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                phone: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_name">Parent Name</Label>
            <Input
              id="parent_name"
              value={editedPlayer.parent_name || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                parent_name: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_email">Parent Email</Label>
            <Input
              id="parent_email"
              type="email"
              value={editedPlayer.parent_email || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                parent_email: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_phone">Parent Phone</Label>
            <Input
              id="parent_phone"
              type="tel"
              value={editedPlayer.parent_phone || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                parent_phone: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">School</Label>
            <Input
              id="school"
              value={editedPlayer.school || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                school: e.target.value
              }))}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
            <Input
              id="emergency_contact_name"
              value={editedPlayer.emergency_contact_name || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                emergency_contact_name: e.target.value
              }))}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              value={editedPlayer.emergency_contact_phone || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                emergency_contact_phone: e.target.value
              }))}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
              value={editedPlayer.notes || ''}
              onChange={(e) => setEditedPlayer(prev => ({
                ...prev,
                notes: e.target.value
              }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
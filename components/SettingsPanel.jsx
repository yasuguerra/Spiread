'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Settings, Palette, Volume2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export default function SettingsPanel() {
  const { settings, updateSettings } = useAppStore()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Objetivo WPM</label>
            <Slider
              value={[settings.wpmTarget]}
              onValueChange={([value]) => updateSettings({ wpmTarget: value })}
              max={1000}
              min={100}
              step={25}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground">
              Objetivo: {settings.wpmTarget} WPM
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Tamaño de Fuente</label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSettings({ fontSize: value })}
              max={32}
              min={12}
              step={2}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground">
              Tamaño: {settings.fontSize}px
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium">Sonidos</label>
              <p className="text-xs text-muted-foreground">
                Efectos de sonido durante la lectura
              </p>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium">Mostrar Instrucciones</label>
              <p className="text-xs text-muted-foreground">
                Ayuda contextual en pantalla
              </p>
            </div>
            <Switch
              checked={settings.showInstructions}
              onCheckedChange={(checked) => updateSettings({ showInstructions: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Apariencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={settings.theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSettings({ theme: 'light' })}
            >
              Claro
            </Button>
            <Button
              variant={settings.theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateSettings({ theme: 'dark' })}
            >
              Oscuro
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
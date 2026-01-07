
import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getConstraints, createConstraint, updateConstraint } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type FillOrder = 'row-wise' | 'column-wise';

type ConstraintsState = {
  alternateSessionsEnabled: boolean;
  noAdjacentSameSession: boolean;
  fillOrder: FillOrder;
  randomShuffle: boolean;
  maxSessionsPerRoom: number;
};


const Constraints = () => {
  const [constraints, setConstraints] = useState<ConstraintsState>({
    alternateSessionsEnabled: false,
    noAdjacentSameSession: true,
    fillOrder: 'row-wise',
    randomShuffle: false,
    maxSessionsPerRoom: 1,
  });
  const [loading, setLoading] = useState(false);
  const [constraintId, setConstraintId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getConstraints()
      .then(res => {
        if (res.data.length > 0) {
          const doc = res.data[0];
          setConstraintId(doc._id);
          // Map backend shape -> UI shape
          setConstraints({
            alternateSessionsEnabled: !!doc.alternateSessionsEnabled,
            noAdjacentSameSession:
              typeof doc.noAdjacentSameSession === 'boolean'
                ? doc.noAdjacentSameSession
                : !doc.allowAdjacentSameSession,
            fillOrder: doc.fillOrder === 'column' ? 'column-wise' : 'row-wise',
            randomShuffle: !!doc.randomShuffle || doc.rollNoOrder === 'random',
            maxSessionsPerRoom: typeof doc.maxSessionsPerRoom === 'number' ? doc.maxSessionsPerRoom : 1,
          });
        }
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load constraints', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  // Save constraints to backend
  const saveConstraints = async (next: ConstraintsState) => {
    setLoading(true);
    try {
      const payload = {
        alternateSessionsEnabled: next.alternateSessionsEnabled,
        noAdjacentSameSession: next.noAdjacentSameSession,
        allowAdjacentSameSession: !next.noAdjacentSameSession,
        fillOrder: next.fillOrder === 'column-wise' ? 'column' : 'row',
        rollNoOrder: next.randomShuffle ? 'random' : 'sequential',
        randomShuffle: next.randomShuffle,
        maxSessionsPerRoom: Number(next.maxSessionsPerRoom) || 1,
      };
      if (constraintId) {
        const res = await updateConstraint(constraintId, payload);
        setConstraintId(res.data._id);
      } else {
        const res = await createConstraint(payload);
        setConstraintId(res.data._id);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save constraints', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const ConstraintCard = ({ 
    title, 
    description, 
    tooltip,
    children 
  }: { 
    title: string; 
    description: string; 
    tooltip?: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-card rounded-lg border border-border/50 shadow-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <PageHeader 
        title="Seating Constraints" 
        description="Configure rules for generating fair seating arrangements."
      />

      <div className="max-w-3xl space-y-4">
        {/* Alternate Sessions */}
        <ConstraintCard
          title="Alternate Sessions"
          description="Students from different sessions will be placed alternately in seats."
          tooltip="This ensures students from different sessions sit next to each other, reducing chances of collaboration."
        >
          <Switch
            checked={constraints.alternateSessionsEnabled}
            onCheckedChange={async (checked) => {
              const next = { ...constraints, alternateSessionsEnabled: checked };
              setConstraints(next);
              await saveConstraints(next);
            }}
          />
        </ConstraintCard>

        {/* No Adjacent Same Session */}
        <ConstraintCard
          title="No Adjacent Same-Session Students"
          description="Prevents two students from the same session from sitting next to each other."
          tooltip="Combined with alternate sessions, this provides maximum mixing of students from different sessions."
        >
          <Switch
            checked={constraints.noAdjacentSameSession}
            onCheckedChange={async (checked) => {
              const next = { ...constraints, noAdjacentSameSession: checked };
              setConstraints(next);
              await saveConstraints(next);
            }}
          />
        </ConstraintCard>

        {/* Max Sessions Per Room */}
        <ConstraintCard
          title="Max Sessions Per Room"
          description="Maximum number of different sessions allowed to be mixed in a single room."
          tooltip="If set to 1, each room will only have students from one session. If set to 2 or more, up to that many different sessions can be mixed in a room."
        >
          <Input
            type="number"
            min={1}
            max={10}
            value={constraints.maxSessionsPerRoom}
            onChange={async (e) => {
              const value = Math.max(1, Math.min(10, Number(e.target.value)));
              const next = { ...constraints, maxSessionsPerRoom: value };
              setConstraints(next);
              await saveConstraints(next);
            }}
            className="w-24 text-center"
          />
        </ConstraintCard>

        {/* Fill Order */}
        <ConstraintCard
          title="Fill Order"
          description="Determine how seats are filled when generating the seating plan."
          tooltip="Row-wise fills seats from left to right, row by row. Column-wise fills seats from top to bottom, column by column."
        >
          <Select
            value={constraints.fillOrder}
            onValueChange={async (value: FillOrder) => {
              const next = { ...constraints, fillOrder: value };
              setConstraints(next);
              await saveConstraints(next);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="row-wise">Row-wise</SelectItem>
              <SelectItem value="column-wise">Column-wise</SelectItem>
            </SelectContent>
          </Select>
        </ConstraintCard>

        {/* Random Shuffle */}
        <ConstraintCard
          title="Random Shuffle"
          description="Randomly shuffle students before assigning seats for additional fairness."
          tooltip="When enabled, students are randomly shuffled before seat assignment, making the arrangement less predictable."
        >
          <Switch
            checked={constraints.randomShuffle}
            onCheckedChange={async (checked) => {
              const next = { ...constraints, randomShuffle: checked };
              setConstraints(next);
              await saveConstraints(next);
            }}
          />
        </ConstraintCard>
      </div>

      {/* Current Configuration Summary */}
      <div className="max-w-3xl">
        <div className="bg-muted/50 rounded-lg border border-border p-5">
          <h3 className="font-semibold text-foreground mb-3">Current Configuration Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alternate Sessions:</span>
              <span className={constraints.alternateSessionsEnabled ? "text-session-2 font-medium" : "text-muted-foreground"}>
                {constraints.alternateSessionsEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">No Adjacent Same:</span>
              <span className={constraints.noAdjacentSameSession ? "text-session-2 font-medium" : "text-muted-foreground"}>
                {constraints.noAdjacentSameSession ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fill Order:</span>
              <span className="font-medium text-foreground capitalize">{constraints.fillOrder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Sessions/Room:</span>
              <span className="font-medium text-foreground">{constraints.maxSessionsPerRoom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Random Shuffle:</span>
              <span className={constraints.randomShuffle ? "text-session-2 font-medium" : "text-muted-foreground"}>
                {constraints.randomShuffle ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Constraints;

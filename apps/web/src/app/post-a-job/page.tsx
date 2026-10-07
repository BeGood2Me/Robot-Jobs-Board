import type { Metadata } from 'next';
import { PostAJobForm } from '@/components/post-a-job-form';

export const metadata: Metadata = {
  title: 'Post a robotics job',
  description:
    'Feature a robotics job on Robot Jobs Board for $149 / 30 days. Candidates apply on your career page.',
};

export default function PostAJobPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Post a Featured job</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        $149 · 30 days near the top of the board. Fill in the role, pay with Stripe, and it goes live
        automatically.
      </p>
      <div className="mt-10">
        <PostAJobForm />
      </div>
    </div>
  );
}

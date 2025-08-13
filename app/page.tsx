import { CustomMDX } from 'app/components/mdx'
import { getAboutContent } from './lib/mdx'

export default function Page() {
  const { metadata, content } = getAboutContent()

  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        {metadata.title}
      </h1>
      <div className="prose prose-neutral dark:prose-invert break-keep">
        <CustomMDX source={content} />
      </div>
    </section>
  )
}

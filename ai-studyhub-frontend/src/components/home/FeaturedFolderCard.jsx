import { useState } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'
import Badge from '../ui/Badge'

export default function FeaturedFolderCard({ folder, onClick }) {
  const [favorite, setFavorite] = useState(Boolean(folder.favorite))

  return (
    <article 
      onClick={onClick} 
      className="group flex flex-col justify-between bg-white border border-slate-100 hover:border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-[210px] relative hover:-translate-y-0.5"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-indigo-100">
              <StudyHubIcon name="folder" size={20} />
            </span>
            <Badge tone="blue">{folder.code}</Badge>
          </div>
          <button
            className={`p-1.5 rounded-full border border-slate-100 hover:border-red-100 hover:bg-red-50/50 transition-colors bg-transparent ${favorite ? 'text-red-500 border-red-50' : 'text-slate-400'}`}
            type="button"
            aria-label={`Save ${folder.title}`}
            onClick={(event) => {
              event.stopPropagation()
              setFavorite((value) => !value)
            }}
          >
            <StudyHubIcon name="heart" size={15} className={favorite ? 'fill-current' : ''} />
          </button>
        </div>
        
        <h3 className="text-[14.5px] font-bold text-slate-800 line-clamp-1 leading-snug group-hover:text-indigo-600 transition-colors mt-2">
          {folder.title}
        </h3>
        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mt-0.5">
          {folder.description || 'No detailed description available.'}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-50 flex items-center gap-4 text-[11.5px] text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <StudyHubIcon name="file" size={13} />
          {folder.files}
        </span>
        <span className="flex items-center gap-1">
          <StudyHubIcon name="download" size={13} />
          {folder.downloads}
        </span>
      </div>
    </article>
  )
}

